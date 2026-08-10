const ApiError = require('../utils/apiError');

/**
 * Zod validation middleware factory
 * Validates req.body against provided Zod schema
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const errors = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(new ApiError(422, 'Validasi gagal', errors));
  }
  req.body = result.data; // Use parsed + sanitized data
  next();
};

module.exports = validate;
