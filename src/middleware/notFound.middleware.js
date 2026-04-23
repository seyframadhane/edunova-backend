const ApiError = require('../utils/ApiError');
module.exports = (req, _res, next) =>
  next(new ApiError(404, `Not found: ${req.originalUrl}`));