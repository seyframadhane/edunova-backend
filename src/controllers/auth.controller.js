const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');

const tokens = (user) => ({
  accessToken:  signAccess({ sub: user.id, role: user.role }),
  refreshToken: signRefresh({ sub: user.id }),
});

exports.signup = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw new ApiError(409, 'Email already registered');
  const user = await User.create(req.body);
  user.password = undefined;
  res.status(201).json({ success: true, data: { user, ...tokens(user) } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }
  user.password = undefined;
  res.json({ success: true, data: { user, ...tokens(user) } });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken required');
  const payload = verifyRefresh(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Invalid refresh');
  res.json({ success: true, data: tokens(user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }
  const user = await User.findById(req.user.sub).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = [
    'firstName', 'lastName', 'email',
    'headline', 'bio', 'phone', 'location', 'website', 'socials',
    'city', 'country',
  ];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  const user = await User.findByIdAndUpdate(
    req.user.sub,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

// ── NEW: Complete onboarding ──
exports.completeOnboarding = asyncHandler(async (req, res) => {
  const { careerGoal, interests, city, country, avatar } = req.body;

  const allowedGoals = ['Enter in new industry', 'Hobby', 'Advance in your field', 'Self Improvement'];
  if (careerGoal && !allowedGoals.includes(careerGoal)) {
    throw new ApiError(400, 'Invalid career goal');
  }

  const updates = {
    careerGoal: careerGoal || null,
    interests: Array.isArray(interests) ? interests.slice(0, 5) : [],
    city: city || '',
    country: country || '',
    onboardingCompleted: true,
  };
  if (avatar) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user.sub, updates, {
    new: true, runValidators: true,
  }).select('-password');

  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

// Avatar upload
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Avatar image is required');

  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

// Cover image upload
exports.uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Cover image is required');

  const coverUrl = `${req.protocol}://${req.get('host')}/uploads/covers/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { coverImage: coverUrl },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});