const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user.sub }).sort('-createdAt');
  res.json({ success: true, data: items });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.sub },
    { isRead: true },
    { new: true }
  );
  if (!notif) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: notif });
});