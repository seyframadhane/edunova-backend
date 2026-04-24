const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// ─── Helper: map UI sort key → Mongo sort object ────────────────────────
const SORT_MAP = {
  popular:    { studentsCount: -1, enrolledCount: -1, rating: -1 },
  rating:     { rating: -1, reviewsCount: -1 },
  newest:     { createdAt: -1 },
  price_asc:  { price: 1 },
  price_desc: { price: -1 },
};

// ─── Helper: parse "Cyber Security,Design" or ["Cyber Security","Design"] → array
const toArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
};

// ─── Helper: parse "3-6 Hours" → { min, max } ───────────────────────────
const parseDuration = (d) => {
  if (!d) return null;
  if (d.includes('+')) return { min: Number(d.replace(/\D/g, '')), max: null };
  const nums = d.match(/\d+/g);
  if (!nums || nums.length < 2) return null;
  return { min: Number(nums[0]), max: Number(nums[1]) };
};

exports.list = asyncHandler(async (req, res) => {
  const {
    q, topic, level, price, minRating,
    duration, minDuration, maxDuration,
    sort = 'popular',
    page = 1, limit = 12,
  } = req.query;

  const filter = { isPublished: true };

  // Text search
  if (q) filter.$text = { $search: q };

  // Topics (multi) — match category OR topics[]
  const topics = toArray(topic);
  if (topics.length) {
    const regexList = topics.map(
      (t) => new RegExp(t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
    );
    filter.$or = [
      { category: { $in: regexList } },
      { topics: { $in: regexList } },
    ];
  }

  // Levels (multi)
  const levels = toArray(level);
  if (levels.length) filter.level = { $in: levels };

  // Price
  if (price === 'Free') filter.isFree = true;
  if (price === 'Paid') filter.isFree = false;

  // Rating
  if (minRating) filter.rating = { $gte: Number(minRating) };

  // Duration — either a preset string from UI (e.g. "3-6 Hours")
  // or direct minDuration/maxDuration numbers
  const dur = parseDuration(duration);
  if (dur) {
    filter.durationHours = {};
    if (dur.min !== null) filter.durationHours.$gte = dur.min;
    if (dur.max !== null) filter.durationHours.$lte = dur.max;
  } else if (minDuration || maxDuration) {
    filter.durationHours = {};
    if (minDuration) filter.durationHours.$gte = Number(minDuration);
    if (maxDuration) filter.durationHours.$lte = Number(maxDuration);
  }

  // Sort
  const sortObj = SORT_MAP[sort] || SORT_MAP.popular;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Course.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('instructor'),
    Course.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { page: Number(page), limit: Number(limit), total },
  });
});

exports.detail = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor')
    .lean();

  if (!course) throw new ApiError(404, 'Course not found');

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
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
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

// ─── Recommended (unchanged behavior, cleaned up) ───────────────────────
exports.recommended = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const user = await User.findById(req.user.sub).lean();

  const filter = { isPublished: true };

  if (user?.interests?.length) {
    const regexList = user.interests.map(
      (i) => new RegExp(i.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
    );
    filter.$or = [
      { category: { $in: regexList } },
      { topics: { $in: regexList } },
    ];
  }

  if (user?.careerGoal === 'Enter in new industry') filter.level = 'Beginner';
  if (user?.careerGoal === 'Advance in your field') filter.level = { $in: ['Intermediate', 'Advanced'] };

  let items = await Course.find(filter)
    .sort('-rating -enrolledCount')
    .limit(Number(limit))
    .populate('instructor');

  if (items.length === 0) {
    items = await Course.find({ isPublished: true })
      .sort('-rating -enrolledCount')
      .limit(Number(limit))
      .populate('instructor');
  }

  res.json({ success: true, data: items, meta: { total: items.length } });
});