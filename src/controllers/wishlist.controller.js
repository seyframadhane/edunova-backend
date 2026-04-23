const WishlistItem = require('../models/WishlistItem');
const asyncHandler = require('../utils/asyncHandler');

exports.get = asyncHandler(async (req, res) => {
  const items = await WishlistItem.find({ user: req.user.sub }).populate('course');
  res.json({ success: true, data: items });
});

exports.toggle = asyncHandler(async (req, res) => {
  const filter = { user: req.user.sub, course: req.params.courseId };
  const existing = await WishlistItem.findOne(filter);
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, data: { wishlisted: false } });
  }
  await WishlistItem.create(filter);
  res.status(201).json({ success: true, data: { wishlisted: true } });
});