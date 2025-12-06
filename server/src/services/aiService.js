const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Default model configurations (used if not specified in .env)
const DEFAULT_MODELS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' }
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq' },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq' },
    { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision', provider: 'Groq' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' }
  ]
};

class AIService {
  constructor() {
    // Initialize API clients
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
    
    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
    
    this.google = process.env.GOOGLE_API_KEY
      ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
      : null;
    
    this.groq = process.env.GROQ_API_KEY
      ? new Groq({ apiKey: process.env.GROQ_API_KEY })
      : null;

    // Load model configurations from .env or use defaults
    this.modelConfigs = this.loadModelConfigs();
    
    // Create a map for quick model lookup
    this.modelMap = this.createModelMap();
  }

  loadModelConfigs() {
    const configs = {
      openai: this.parseModelsFromEnv('OPENAI_MODELS', DEFAULT_MODELS.openai),
      anthropic: this.parseModelsFromEnv('ANTHROPIC_MODELS', DEFAULT_MODELS.anthropic),
      google: this.parseModelsFromEnv('GOOGLE_MODELS', DEFAULT_MODELS.google),
      groq: this.parseModelsFromEnv('GROQ_MODELS', DEFAULT_MODELS.groq)
    };

    console.log('Loaded model configurations:', JSON.stringify(configs, null, 2));
    return configs;
  }

  parseModelsFromEnv(envKey, defaultModels) {
    const envValue = process.env[envKey];
    
    if (!envValue) {
      return defaultModels;
    }

    try {
      const parsed = JSON.parse(envValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each model has required fields
        const valid = parsed.every(m => m.id && m.name && m.provider);
        if (valid) {
          return parsed;
        } else {
          console.warn(`Invalid model config in ${envKey}, using defaults`);
          return defaultModels;
        }
      }
    } catch (err) {
      console.warn(`Failed to parse ${envKey}, using defaults:`, err.message);
    }

    return defaultModels;
  }

  createModelMap() {
    const map = {};
    
    // Map OpenAI models
    if (this.openai) {
      this.modelConfigs.openai.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'openai' };
      });
    }

    // Map Anthropic models
    if (this.anthropic) {
      this.modelConfigs.anthropic.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'anthropic' };
      });
    }

    // Map Google models
    if (this.google) {
      this.modelConfigs.google.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'google' };
      });
    }

    // Map Groq models
    if (this.groq) {
      this.modelConfigs.groq.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'groq' };
      });
    }

    return map;
  }

  async chat(messages, modelId = 'gpt-4o-mini', temperature = 0.7) {
    const modelConfig = this.modelMap[modelId];
    
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const apiProvider = modelConfig.apiProvider;

    switch (apiProvider) {
      case 'openai':
        return await this.chatOpenAI(messages, modelId, temperature);
      case 'anthropic':
        return await this.chatAnthropic(messages, modelId, temperature);
      case 'google':
        return await this.chatGoogle(messages, modelId, temperature);
      case 'groq':
        return await this.chatGroq(messages, modelId, temperature);
      default:
        throw new Error(`Unknown API provider: ${apiProvider}`);
    }
  }

  async chatOpenAI(messages, model, temperature) {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      temperature
    });

    return {
      role: 'assistant',
      content: response.choices[0].message.content
    };
  }

  async chatAnthropic(messages, model, temperature) {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    // Convert messages format (Anthropic requires system message separate)
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 4096,
      temperature,
      system: systemMessage?.content || undefined,
      messages: conversationMessages
    });

    return {
      role: 'assistant',
      content: response.content[0].text
    };
  }

  async chatGoogle(messages, model, temperature) {
    if (!this.google) {
      throw new Error('Google API key not configured');
    }

    const genModel = this.google.getGenerativeModel({ model });

    // Convert messages to Gemini format
    const history = [];
    let lastUserMessage = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini doesn't have system role, prepend to first user message
        continue;
      } else if (msg.role === 'user') {
        lastUserMessage = msg.content;
      } else if (msg.role === 'assistant') {
        if (lastUserMessage) {
          history.push({
            role: 'user',
            parts: [{ text: lastUserMessage }]
          });
          lastUserMessage = '';
        }
        history.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    const chat = genModel.startChat({
      history,
      generationConfig: {
        temperature,
        maxOutputTokens: 4096
      }
    });

    const result = await chat.sendMessage(lastUserMessage);
    const response = await result.response;

    return {
      role: 'assistant',
      content: response.text()
    };
  }

  async chatGroq(messages, model, temperature) {
    if (!this.groq) {
      throw new Error('Groq API key not configured');
    }

    const response = await this.groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 4096
    });

    return {
      role: 'assistant',
      content: response.choices[0].message.content
    };
  }

  getAvailableModels() {
    const available = [];

    if (this.openai) {
      this.modelConfigs.openai.forEach(model => {
        available.push(model);
      });
    }

    if (this.anthropic) {
      this.modelConfigs.anthropic.forEach(model => {
        available.push(model);
      });
    }

    if (this.google) {
      this.modelConfigs.google.forEach(model => {
        available.push(model);
      });
    }

    if (this.groq) {
      this.modelConfigs.groq.forEach(model => {
        available.push(model);
      });
    }

    return available;
  }
}

module.exports = new AIService();

