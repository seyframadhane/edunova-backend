const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
}, { timestamps: true });

cartItemSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);