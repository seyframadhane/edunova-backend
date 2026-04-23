const mongoose = require("mongoose");

const GeminiCourseFileSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    pdfUrl: { type: String, required: true },
    pdfUrlHash: { type: String, required: true, index: true },

    // Gemini file reference
    geminiFileUri: { type: String, required: true },
    geminiMimeType: { type: String, default: "application/pdf" },
  },
  { timestamps: true }
);

GeminiCourseFileSchema.index({ course: 1, pdfUrlHash: 1 }, { unique: true });

module.exports = mongoose.model("GeminiCourseFile", GeminiCourseFileSchema);
