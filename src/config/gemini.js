const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('./env');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const getGeminiModel = (modelName = 'gemini-3.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

const generateAIContent = async (prompt) => {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`[Gemini AI] Model ${modelName} failed, trying fallback:`, err.message);
      lastError = err;
    }
  }

  throw lastError;
};

module.exports = { genAI, getGeminiModel, generateAIContent };
