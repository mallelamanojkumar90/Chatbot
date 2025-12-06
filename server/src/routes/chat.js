const express = require('express');
const langchainService = require('../services/langchainService');

const router = express.Router();

// Get available models
router.get('/models', (req, res) => {
  try {
    const models = langchainService.getAvailableModels();
    res.json({ models });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Chat completion with LangChain
router.post('/', async (req, res) => {
  try {
    const { messages, model, conversationId } = req.body || {};
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }

    const selectedModel = model || 'gpt-4o-mini';
    
    // Use LangChain service
    const response = await langchainService.chat(
      messages, 
      selectedModel, 
      0.7,
      conversationId
    );
    
    res.json({ message: response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to generate response' 
    });
  }
});

module.exports = router;

