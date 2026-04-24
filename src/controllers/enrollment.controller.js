const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

exports.myEnrollments = asyncHandler(async (req, res) => {
  const items = await Enrollment.find({ user: req.user.sub }).populate('course');
  res.json({ success: true, data: items });
});

exports.enroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) throw new ApiError(400, 'courseId is required');

  // Upsert so users can't double-enroll; only count the first-time insert.
  const existing = await Enrollment.findOne({ user: req.user.sub, course: courseId });
  const enrollment = await Enrollment.findOneAndUpdate(
    { user: req.user.sub, course: courseId },
    { $setOnInsert: { user: req.user.sub, course: courseId } },
    { upsert: true, new: true }
  );

  // Only bump counters on the first enrollment
  if (!existing) {
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledCount: 1, studentsCount: 1 },
    });
  }

  res.status(201).json({ success: true, data: enrollment });
});

exports.updateProgress = asyncHandler(async (req, res) => {
  const { progress, lessonId } = req.body;
  const enrollment = await Enrollment.findOne({ _id: req.params.id, user: req.user.sub });
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');

  if (typeof progress === 'number') enrollment.progress = Math.min(100, Math.max(0, progress));
  if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
    enrollment.completedLessons.push(lessonId);
  }

  if (enrollment.progress >= 100 && enrollment.status !== 'completed') {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    await Certificate.create({
      user: enrollment.user,
      course: enrollment.course,
      code: 'EDU-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
    });
  }

  await enrollment.save();
  res.json({ success: true, data: enrollment });
});