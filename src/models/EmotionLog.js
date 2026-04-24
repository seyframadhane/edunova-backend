const mongoose = require('mongoose');

const emotionLogSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  emotion: {
    type: String,
    enum: ['engaged', 'confused', 'frustrated', 'confident', 'neutral'],
    required: true,
  },
}, { timestamps: true });

emotionLogSchema.index({ user: 1, course: 1, createdAt: -1 });

module.exports = mongoose.model('EmotionLog', emotionLogSchema);