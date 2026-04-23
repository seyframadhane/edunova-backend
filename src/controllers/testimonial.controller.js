const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (_req, res) => {
  const items = await Testimonial.find({ approved: true }).sort('-createdAt');
  res.json({ success: true, data: items });
});