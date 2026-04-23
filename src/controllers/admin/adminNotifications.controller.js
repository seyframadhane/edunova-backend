const Notification = require("../../models/Notification");
const Enrollment = require("../../models/Enrollment");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");

exports.broadcastNotification = asyncHandler(async (req, res) => {
  const { audience, userId, courseId, type, title, description, icon, link } = req.body;

  let recipientUserIds = [];

  if (audience === "all") {
    const users = await User.find({}, { _id: 1 });
    recipientUserIds = users.map((u) => String(u._id));
  }

  if (audience === "single_user") {
    if (!userId) throw new ApiError(400, "userId required");
    recipientUserIds = [userId];
  }

  if (audience === "enrolled_in_course") {
    if (!courseId) throw new ApiError(400, "courseId required");
    const enrollments = await Enrollment.find({ course: courseId }, { user: 1 });
    recipientUserIds = enrollments.map((e) => String(e.user));
  }

  if (!recipientUserIds.length) {
    return res.status(201).json({ success: true, data: { created: 0 } });
  }

  const docs = recipientUserIds.map((uid) => ({
    user: uid,
    type,
    title,
    description,
    icon,
    link,
    course: courseId || undefined,
    isRead: false,
  }));

  await Notification.insertMany(docs);

  res.status(201).json({ success: true, data: { created: docs.length } });
});
