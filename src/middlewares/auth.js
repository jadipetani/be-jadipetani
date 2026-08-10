const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * JWT authentication middleware
 * Verifies Bearer token from Authorization header
 * Attaches { id, role } to req.user
 */
const auth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token sudah kedaluwarsa'));
    }
    return next(ApiError.unauthorized('Token tidak valid'));
  }
};

module.exports = auth;
