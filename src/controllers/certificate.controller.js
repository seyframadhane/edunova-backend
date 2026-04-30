const Certificate = require('../models/Certificate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');

exports.mine = asyncHandler(async (req, res) => {
  const items = await Certificate.find({ user: req.user.sub }).populate('course');
  res.json({ success: true, data: items });
});

exports.getById = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id)
    .populate('course')
    .populate('user', 'firstName lastName name'); // Depending on User schema
  if (!cert) throw new ApiError(404, 'Certificate not found');
  
  // Optional: check if they are the owner, but certificates can be public
  res.json({ success: true, data: cert });
});

exports.claim = asyncHandler(async (req, res) => {
  const { courseId, score } = req.body;
  if (!courseId || score === undefined) throw new ApiError(400, 'courseId and score are required');

  if (score < 0.7) {
    throw new ApiError(400, 'Score must be at least 70% to claim certificate');
  }

  // Ensure they don't already have one
  let cert = await Certificate.findOne({ user: req.user.sub, course: courseId }).populate('course');
  if (!cert) {
    cert = await Certificate.create({
      user: req.user.sub,
      course: courseId,
      code: 'EDU-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
    });
    cert = await cert.populate('course');
  }

  res.json({ success: true, data: cert });
});