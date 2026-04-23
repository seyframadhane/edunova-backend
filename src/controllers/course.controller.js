const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { q, topic, level, price, minRating, minDuration, maxDuration,
          page = 1, limit = 12, sort = '-createdAt' } = req.query;

  const filter = { isPublished: true };
  if (q)        filter.$text = { $search: q };
  if (topic)    filter.topics = { $in: [].concat(topic) };
  if (level)    filter.level  = { $in: [].concat(level) };
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
  const course = await Course.findById(req.params.id).populate('instructor');
  if (!course) throw new ApiError(404, 'Course not found');
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

  // Build URL for stored file
  const pdfUrl = `${req.protocol}://${req.get('host')}/uploads/pdfs/${req.file.filename}`;

  course.contentType = 'pdf';
  course.pdfUrl = pdfUrl;
  await course.save();

  res.json({ success: true, data: course });
});
