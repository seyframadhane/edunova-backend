// const mongoose = require('mongoose');

// const courseSchema = new mongoose.Schema({
//   title:       { type: String, required: true, trim: true, index: 'text' },
//   description: { type: String },
//   image:       { type: String },
//   category:    { type: String, required: true, index: true },
//   topics:      [{ type: String, index: true }],
//   level:       { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
//   instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
//   price:       { type: Number, required: true, min: 0 },
//   oldPrice:    { type: Number, min: 0 },
//   isFree:      { type: Boolean, default: false },
//   durationHours: { type: Number, default: 0 },
//   unitsCount:    { type: Number, default: 0 },
//   modulesCount:  { type: Number, default: 0 },
//   rating:        { type: Number, default: 0, min: 0, max: 5 },
//   reviewsCount:  { type: Number, default: 0 },
//   studentsCount: { type: Number, default: 0 },
//   isTrending:    { type: Boolean, default: false },
//   isPublished:   { type: Boolean, default: true },
// }, { timestamps: true });

// courseSchema.index({ category: 1, level: 1, price: 1, rating: -1 });

// module.exports = mongoose.model('Course', courseSchema);

// src/models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String },
  image: { type: String },
  category: { type: String, required: true, index: true },
  topics: [{ type: String, index: true }],
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },

  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  isFree: { type: Boolean, default: false },

  durationHours: { type: Number, default: 0 },
  unitsCount: { type: Number, default: 0 },
  modulesCount: { type: Number, default: 0 },

  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  studentsCount: { type: Number, default: 0 },

  isTrending: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },

  // ✅ NEW: Content fields
  contentType: { type: String, enum: ['pdf', 'video', 'mixed'], default: 'pdf' },
  pdfUrl: { type: String },   // required when contentType = 'pdf' (we can validate in controller)
  videoUrl: { type: String }, // optional for future

}, { timestamps: true });

courseSchema.index({ category: 1, level: 1, price: 1, rating: -1 });

module.exports = mongoose.model('Course', courseSchema);
