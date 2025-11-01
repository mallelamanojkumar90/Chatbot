const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createOpenAIClient } = require('../server/src/openaiClient');

dotenv.config();

const app = express();
app.use(express.json());

// CORS - allow all origins for Vercel deployment
app.use(cors());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat route
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }

    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages,
      temperature: 0.7
    });

    const choice = response.choices?.[0]?.message || { role: 'assistant', content: '' };
    res.json({ message: choice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Export the Express app as a Vercel serverless function
module.exports = app;

