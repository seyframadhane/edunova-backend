const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  role: String,
  bio:  String,
  image: String,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  coursesCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Instructor', instructorSchema);