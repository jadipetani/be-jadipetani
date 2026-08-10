const { Resend } = require('resend');
const { env } = require('./env');

const resend = new Resend(env.RESEND_API_KEY);

module.exports = { resend };
