const ApiError = require('../utils/ApiError');

module.exports = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
  if (!result.success) {
    return next(new ApiError(400, 'Validation error', result.error.flatten()));
  }
  next();
};