const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('./env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const getGeminiModel = (modelName = 'gemini-2.0-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

module.exports = { genAI, getGeminiModel };
