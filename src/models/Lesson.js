const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  module:   { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
  title:    { type: String, required: true },
  videoUrl: String,
  content:  String,
  durationMinutes: { type: Number, default: 0 },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);