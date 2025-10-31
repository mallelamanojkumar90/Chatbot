const express = require('express');
const { createOpenAIClient } = require('../openaiClient');

const router = express.Router();

// Simple non-streaming chat completion
router.post('/', async (req, res) => {
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

module.exports = router;


