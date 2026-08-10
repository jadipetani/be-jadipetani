class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Tidak terautentikasi') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Akses ditolak') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Tidak ditemukan') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static tooMany(message = 'Terlalu banyak request') {
    return new ApiError(429, message);
  }

  static internal(message = 'Terjadi kesalahan pada server') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
