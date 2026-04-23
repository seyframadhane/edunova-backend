const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.create(req.body);
  res.status(201).json({ success: true, data: msg });
});