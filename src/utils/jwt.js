const jwt = require('jsonwebtoken');

exports.signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

exports.signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

exports.verifyAccess = (t) => jwt.verify(t, process.env.JWT_ACCESS_SECRET);
exports.verifyRefresh = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);