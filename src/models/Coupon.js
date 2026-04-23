const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:       { type: String, unique: true, uppercase: true, required: true },
  percentOff: { type: Number, min: 0, max: 100 },
  amountOff:  { type: Number, min: 0 },
  expiresAt:  Date,
  usageLimit: { type: Number, default: 0 },
  usedCount:  { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);