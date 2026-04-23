// src/controllers/chat.controller.js
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const { GoogleGenAI } = require("@google/genai");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const GeminiCourseFile = require("../models/GeminiCourseFile");

function sha1(str) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

// Convert pdfUrl like http://localhost:5001/uploads/pdfs/xxx.pdf -> local file path uploads/pdfs/xxx.pdf
function pdfUrlToLocalPath(pdfUrl) {
  const idx = pdfUrl.indexOf("/uploads/");
  if (idx === -1) return null;

  const rel = pdfUrl.slice(idx + "/uploads/".length); // e.g. "pdfs/xxx.pdf"
  return path.join(process.cwd(), "uploads", rel);
}

// Extract plain text answer from @google/genai generateContent result
function extractAnswerText(result) {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();
}

// Detect Gemini "file permission" issue (happens if you changed API key/project but DB cached old file URI)
function isGeminiFilePermissionError(err) {
  const msg = String(err?.message || "");
  return (
    msg.includes("PERMISSION_DENIED") &&
    (msg.includes("permission to access the File") || msg.includes("does not have permission"))
  );
}

// Detect quota / rate limit error
function isGeminiQuotaError(err) {
  const msg = String(err?.message || "");
  return msg.includes('"code":429') || msg.includes("RESOURCE_EXHAUSTED");
}

// Upload PDF to Gemini and return file URI (top-level "uri" from SDK)
async function uploadPdfToGemini({ ai, pdfUrl }) {
  const localPdfPath = pdfUrlToLocalPath(pdfUrl);
  if (!localPdfPath) throw new ApiError(400, "Invalid pdfUrl format (must contain /uploads/...)");

  if (!fs.existsSync(localPdfPath)) {
    throw new ApiError(404, `PDF file not found on server: ${localPdfPath}`);
  }

  const upload = await ai.files.upload({
    file: localPdfPath,
    config: { mimeType: "application/pdf" },
  });

  // NOTE: upload response shape (confirmed from your logs):
  // { name, mimeType, ..., uri, state, source }
  const geminiFileUri = upload?.uri;
  if (!geminiFileUri) throw new ApiError(500, "Gemini file upload failed (no uri returned)");

  return {
    geminiFileUri,
    geminiMimeType: upload?.mimeType || "application/pdf",
    expirationTime: upload?.expirationTime, // optional (you can store later if you want)
    name: upload?.name, // optional
  };
}

// Call Gemini with PDF context
async function askGeminiWithPdf({ ai, model, fileUri, mimeType, prompt }) {
  return ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri,
              mimeType: mimeType || "application/pdf",
            },
          },
          {
            text:
              "You are a course assistant. Answer ONLY using the PDF content.\n" +
              'If the answer is not in the PDF, say: "I can\'t find that in the provided PDF."\n\n' +
              `Question: ${String(prompt).trim()}`,
          },
        ],
      },
    ],
  });
}

exports.courseChat = asyncHandler(async (req, res) => {
  const userId = req.user?.sub; // from JWT payload
  const { courseId, prompt } = req.body;

  if (!courseId) throw new ApiError(400, "courseId is required");
  if (!prompt || String(prompt).trim().length < 1) throw new ApiError(400, "prompt is required");
  if (!process.env.GEMINI_API_KEY) throw new ApiError(500, "Missing GEMINI_API_KEY in .env");

  // 1) Load course and pdfUrl
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");
  if (!course.pdfUrl) throw new ApiError(400, "This course has no pdfUrl");

  // 2) Verify enrollment (recommended)
  const enrolled = await Enrollment.findOne({ user: userId, course: courseId });
  if (!enrolled) throw new ApiError(403, "You must be enrolled to use the assistant for this course");

  const pdfUrl = course.pdfUrl;
  const pdfUrlHash = sha1(pdfUrl);

  // 3) Gemini client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // 4) Cache lookup (course + pdfUrl)
  let cached = await GeminiCourseFile.findOne({ course: courseId, pdfUrlHash });

  // 5) Ensure we have a valid Gemini file URI for THIS key/project
  if (!cached) {
    const uploaded = await uploadPdfToGemini({ ai, pdfUrl });

    cached = await GeminiCourseFile.create({
      course: courseId,
      pdfUrl,
      pdfUrlHash,
      geminiFileUri: uploaded.geminiFileUri,
      geminiMimeType: uploaded.geminiMimeType,
    });
  }

  // 6) Ask Gemini (use a model that has quota in your AI Studio rate limit page)
  // Based on your screenshot: Gemini 2.5 Flash has free-tier limits; Gemini 2.0 Flash was 0.
  const MODEL_NAME = "models/gemini-2.5-flash";

  let result;
  try {
    result = await askGeminiWithPdf({
      ai,
      model: MODEL_NAME,
      fileUri: cached.geminiFileUri,
      mimeType: cached.geminiMimeType,
      prompt,
    });
  } catch (err) {
    // If you changed API key/project, cached.geminiFileUri can become invalid → delete cache + reupload + retry once
    if (isGeminiFilePermissionError(err)) {
      await GeminiCourseFile.deleteOne({ _id: cached._id });

      const uploaded = await uploadPdfToGemini({ ai, pdfUrl });

      cached = await GeminiCourseFile.create({
        course: courseId,
        pdfUrl,
        pdfUrlHash,
        geminiFileUri: uploaded.geminiFileUri,
        geminiMimeType: uploaded.geminiMimeType,
      });

      // retry once
      result = await askGeminiWithPdf({
        ai,
        model: MODEL_NAME,
        fileUri: cached.geminiFileUri,
        mimeType: cached.geminiMimeType,
        prompt,
      });
    } else if (isGeminiQuotaError(err)) {
      throw new ApiError(
        429,
        "Gemini rate limit/quota reached. Please wait a bit and try again (free tier is limited)."
      );
    } else {
      // keep original error details for debugging
      throw err;
    }
  }

  const answer = extractAnswerText(result);

  res.json({
    success: true,
    data: {
      courseId,
      answer: answer || "No answer returned.",
    },
  });
});
