const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.validate = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').toUpperCase();
  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw new ApiError(404, 'Invalid coupon');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, 'Coupon expired');
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }
  res.json({
    success: true,
    data: { code: coupon.code, percentOff: coupon.percentOff, amountOff: coupon.amountOff },
  });
});