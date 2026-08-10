/**
 * Standard success response helper
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Berhasil']
 * @param {*} [options.data=null]
 * @param {Object} [options.meta=null]
 */
const success = (res, { statusCode = 200, message = 'Berhasil', data = null, meta = null } = {}) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

module.exports = { success };
