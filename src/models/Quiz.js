const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: 'A quiz question must have exactly 4 options.',
      },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

quizSchema.index({ course: 1, createdAt: 1 });

module.exports = mongoose.model('Quiz', quizSchema);