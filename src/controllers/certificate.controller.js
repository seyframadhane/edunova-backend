const Certificate = require('../models/Certificate');
const asyncHandler = require('../utils/asyncHandler');

exports.mine = asyncHandler(async (req, res) => {
  const items = await Certificate.find({ user: req.user.sub }).populate('course');
  res.json({ success: true, data: items });
});