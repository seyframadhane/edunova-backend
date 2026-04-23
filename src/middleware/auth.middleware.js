const { verifyAccess } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

exports.verifyToken = (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Missing token');
    req.user = verifyAccess(token);
    next();
  } catch (e) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

exports.requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }
  next();
};

exports.requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new ApiError(403, 'Forbidden'));
  next();
};
