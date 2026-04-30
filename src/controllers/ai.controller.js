const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const aiService = require('../services/ai.service');
const EmotionLog = require('../models/EmotionLog');

exports.chat = asyncHandler(async (req, res) => {
  const { courseId, history = [], message } = req.body;
  if (!courseId || !message) throw new ApiError(400, 'courseId and message are required');

  const safeHistory = Array.isArray(history)
    ? history.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    : [];

  const reply = await aiService.chat({ courseId, history: safeHistory, message: String(message) });
  res.json({ success: true, data: { reply } });
});

exports.summary = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) throw new ApiError(400, 'courseId is required');
  const summary = await aiService.summarize({ courseId });
  res.json({ success: true, data: { summary } });
});

exports.quiz = asyncHandler(async (req, res) => {
  const { courseId, count } = req.body;
  if (!courseId) throw new ApiError(400, 'courseId is required');
  const questions = await aiService.quiz({ courseId, count });
  res.json({ success: true, data: { questions } });
});

exports.logEmotion = asyncHandler(async (req, res) => {
  const { courseId, emotion } = req.body;
  if (!courseId || !emotion) throw new ApiError(400, 'courseId and emotion are required');

  const allowed = ['engaged', 'confused', 'frustrated', 'confident', 'neutral'];
  if (!allowed.includes(emotion)) throw new ApiError(400, 'Invalid emotion label');

  await EmotionLog.create({ user: req.user.sub, course: courseId, emotion });
  res.json({ success: true });
});

exports.emotionStats = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const filter = { user: req.user.sub };
  if (courseId) filter.course = courseId;

  const logs = await EmotionLog.find(filter).sort('-createdAt').limit(200).lean();
  const counts = logs.reduce((acc, l) => {
    acc[l.emotion] = (acc[l.emotion] || 0) + 1;
    return acc;
  }, {});
  res.json({ success: true, data: { logs, counts } });
});