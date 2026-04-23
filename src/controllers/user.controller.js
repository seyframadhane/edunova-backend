const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { firstName, lastName, avatar },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});