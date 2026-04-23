const Instructor = require('../models/Instructor');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (_req, res) => {
  const items = await Instructor.find().sort('-rating');
  res.json({ success: true, data: items });
});

exports.detail = asyncHandler(async (req, res) => {
  const instructor = await Instructor.findById(req.params.id);
  if (!instructor) throw new ApiError(404, 'Instructor not found');
  const courses = await Course.find({ instructor: instructor._id });
  res.json({ success: true, data: { instructor, courses } });
});

exports.create = asyncHandler(async (req, res) => {
  const instructor = await Instructor.create(req.body);
  res.status(201).json({ success: true, data: instructor });
});