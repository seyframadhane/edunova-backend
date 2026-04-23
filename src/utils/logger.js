const log = (level, ...args) =>
  console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}]`, ...args);

module.exports = {
  info:  (...a) => log('info', ...a),
  warn:  (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a),
};