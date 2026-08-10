const ApiError = require('../utils/apiError');

/**
 * Role-based authorization middleware
 * Must be used AFTER auth middleware
 * @param  {...string} roles - Allowed roles (e.g. 'FARMER', 'STUDENT')
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('Anda tidak memiliki akses ke resource ini'));
  }
  next();
};

module.exports = authorize;
