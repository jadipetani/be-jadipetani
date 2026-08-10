/**
 * Parse pagination params from query string
 * @param {Object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination meta object for response
 * @param {number} total - Total count from DB
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const paginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { paginate, paginationMeta };
