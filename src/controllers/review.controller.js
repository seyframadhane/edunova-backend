const Review = require('../models/Review');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');

async function recomputeCourseStats(courseId) {
  const agg = await Review.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: '$course',
        avg:   { $avg: '$rating' },
        count: { $sum: 1 },
        liked: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
      },
    },
  ]);

  const { avg = 0, count = 0, liked = 0 } = agg[0] || {};
  const likedPercentage = count ? Math.round((liked / count) * 100) : 0;

  await Course.findByIdAndUpdate(courseId, {
    rating: Math.round(avg * 10) / 10,
    reviewsCount: count,
    likedPercentage,
  });
}

exports.create = asyncHandler(async (req, res) => {
  const { courseId, rating, comment } = req.body;
  const review = await Review.findOneAndUpdate(
    { user: req.user.sub, course: courseId },
    { user: req.user.sub, course: courseId, rating, comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await recomputeCourseStats(review.course);
  res.status(201).json({ success: true, data: review });
});

exports.forCourse = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ course: req.params.id })
    .populate('user', 'firstName lastName avatar')
    .sort('-createdAt');
  res.json({ success: true, data: reviews });
});