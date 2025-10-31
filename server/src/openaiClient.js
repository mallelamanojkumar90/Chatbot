const OpenAI = require('openai');

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY. Set it in your environment.');
  }
  return new OpenAI({ apiKey });
}

module.exports = { createOpenAIClient };


