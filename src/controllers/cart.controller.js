const CartItem = require('../models/CartItem');
const Coupon = require('../models/Coupon');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.get = asyncHandler(async (req, res) => {
  const items = await CartItem.find({ user: req.user.sub }).populate('course');
  res.json({ success: true, data: items });
});

exports.add = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const item = await CartItem.findOneAndUpdate(
    { user: req.user.sub, course: courseId },
    { $setOnInsert: { user: req.user.sub, course: courseId } },
    { upsert: true, new: true }
  );
  res.status(201).json({ success: true, data: item });
});

exports.remove = asyncHandler(async (req, res) => {
  await CartItem.findOneAndDelete({ user: req.user.sub, course: req.params.courseId });
  res.json({ success: true });
});

exports.checkout = asyncHandler(async (req, res) => {
  const { couponCode, redeemPoints = 0 } = req.body;
  const userId = req.user.sub;

  const items = await CartItem.find({ user: userId }).populate('course');
  if (!items.length) throw new ApiError(400, 'Cart is empty');

  let total = items.reduce((s, i) => s + i.course.price, 0);

  if (couponCode) {
    const c = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!c || (c.expiresAt && c.expiresAt < new Date())) {
      throw new ApiError(400, 'Invalid coupon');
    }
    if (c.percentOff) total -= Math.round(total * (c.percentOff / 100));
    if (c.amountOff)  total -= c.amountOff;
    c.usedCount += 1;
    await c.save();
  }

  const user = await User.findById(userId);
  const pointsUsed = Math.min(redeemPoints, user.points, total);
  total -= pointsUsed;
  user.points -= pointsUsed;
  user.points += Math.floor(total * 0.05); // 5% loyalty
  await user.save();

  await Promise.all(items.map(i =>
    Enrollment.updateOne(
      { user: userId, course: i.course._id },
      { $setOnInsert: { user: userId, course: i.course._id } },
      { upsert: true }
    )
  ));
  await CartItem.deleteMany({ user: userId });

  res.json({ success: true, data: { total, pointsUsed, pointsBalance: user.points } });
});