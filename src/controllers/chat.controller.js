// src/controllers/chat.controller.js
const { GoogleGenAI } = require("@google/genai");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const MODEL_NAME = "models/gemini-2.5-flash";
const MAX_HISTORY_TURNS = 30;

function extractText(result) {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("").trim();
}

exports.courseChat = asyncHandler(async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt || String(prompt).trim().length < 1) {
    throw new ApiError(400, "prompt is required");
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "Missing GEMINI_API_KEY in .env");
  }

  // Sanitize the history coming from the frontend
  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
        .slice(-MAX_HISTORY_TURNS)
    : [];

  // Build Gemini contents: previous turns + the new user message
  const contents = [
    ...safeHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: String(prompt).trim() }] },
  ];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      systemInstruction: {
        parts: [
          {
            text: "You are a friendly, helpful assistant. Reply naturally and conversationally. Keep answers concise unless the user asks for detail.",
          },
        ],
      },
      temperature: 0.8,
    },
  });

  res.json({
    success: true,
    data: { answer: extractText(result) || "No answer returned." },
  });
});