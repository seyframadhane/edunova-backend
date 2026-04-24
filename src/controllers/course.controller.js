const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { q, topic, level, price, minRating, minDuration, maxDuration,
          page = 1, limit = 12, sort = '-createdAt' } = req.query;

  const filter = { isPublished: true };
  if (q) filter.$text = { $search: q };
  if (topic) filter.topics = { $in: [].concat(topic) };
  if (level) filter.level = { $in: [].concat(level) };
  if (price === 'Free') filter.isFree = true;
  if (price === 'Paid') filter.isFree = false;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (minDuration || maxDuration) {
    filter.durationHours = {};
    if (minDuration) filter.durationHours.$gte = Number(minDuration);
    if (maxDuration) filter.durationHours.$lte = Number(maxDuration);
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Course.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate('instructor'),
    Course.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { page: Number(page), limit: Number(limit), total } });
});

exports.detail = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor')
    .lean();

  if (!course) throw new ApiError(404, 'Course not found');

  // If authenticated, flag enrollment so the UI can switch CTA
  if (req.user?.sub) {
    const enrolled = await Enrollment.exists({ user: req.user.sub, course: course._id });
    course.isEnrolled = !!enrolled;
  }

  res.json({ success: true, data: course });
});

exports.create = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json({ success: true, data: course });
});

exports.update = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ success: true, data: course });
});

exports.remove = asyncHandler(async (req, res) => {
  const ok = await Course.findByIdAndDelete(req.params.id);
  if (!ok) throw new ApiError(404, 'Course not found');
  res.json({ success: true });
});

exports.uploadPdf = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  if (!req.file) throw new ApiError(400, 'PDF file is required');

  const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/pdfs/${req.file.filename}`;
  course.contentType = course.videoUrl ? 'mixed' : 'pdf';
  course.pdfUrl = pdfUrl;
  await course.save();

  res.json({ success: true, data: course });
});

exports.uploadVideo = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  if (!req.file) throw new ApiError(400, 'Video file is required');

  const videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;
  course.contentType = course.pdfUrl ? 'mixed' : 'video';
  course.videoUrl = videoUrl;
  await course.save();

  res.json({ success: true, data: course });
});

const User = require('../models/User');

// ✅ NEW: courses that match the authenticated user's onboarding data
exports.recommended = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const user = await User.findById(req.user.sub).lean();

  const filter = { isPublished: true };

  // Match by interests (category or topics)
  if (user?.interests?.length) {
    const regexList = user.interests.map(
      i => new RegExp(i.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
    );
    filter.$or = [
      { category: { $in: regexList } },
      { topics:   { $in: regexList } },
    ];
  }

  // Career-goal → level bias
  if (user?.careerGoal === 'Enter in new industry') filter.level = 'Beginner';
  if (user?.careerGoal === 'Advance in your field') filter.level = { $in: ['Intermediate', 'Advanced'] };

  let items = await Course.find(filter)
    .sort('-rating -enrolledCount')
    .limit(Number(limit))
    .populate('instructor');

  // Fallback: if no matches, return trending courses
  if (items.length === 0) {
    items = await Course.find({ isPublished: true })
      .sort('-rating -enrolledCount')
      .limit(Number(limit))
      .populate('instructor');
  }

  res.json({ success: true, data: items, meta: { total: items.length } });
});