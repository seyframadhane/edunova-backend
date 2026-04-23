module.exports = (err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    details: err.details,
  });
};