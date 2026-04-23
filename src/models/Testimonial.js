const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:    String,
  handle:  String,
  image:   String,
  content: { type: String, required: true },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);