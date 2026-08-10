const { env } = require('../config/env');

/**
 * Global error handler middleware
 * HARUS diregister terakhir di app.js
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  if (env.NODE_ENV === 'production') {
    // TODO: Sentry.captureException(err);
    if (statusCode >= 500) {
      console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    }
  } else {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan pada server'
      : message,
    errors: err.errors || [],
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
