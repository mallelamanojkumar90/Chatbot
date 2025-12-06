const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatGroq } = require('@langchain/groq');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');

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

class LangChainAIService {
  constructor() {
    // Load model configurations from .env or use defaults
    this.modelConfigs = this.loadModelConfigs();
    
    // Create a map for quick model lookup
    this.modelMap = this.createModelMap();

    console.log('LangChain AI Service initialized');
    console.log('Available models:', this.getAvailableModels().map(m => m.id));
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
    if (process.env.OPENAI_API_KEY) {
      this.modelConfigs.openai.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'openai' };
      });
    }

    // Map Anthropic models
    if (process.env.ANTHROPIC_API_KEY) {
      this.modelConfigs.anthropic.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'anthropic' };
      });
    }

    // Map Google models
    if (process.env.GOOGLE_API_KEY) {
      this.modelConfigs.google.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'google' };
      });
    }

    // Map Groq models
    if (process.env.GROQ_API_KEY) {
      this.modelConfigs.groq.forEach(model => {
        map[model.id] = { ...model, apiProvider: 'groq' };
      });
    }

    return map;
  }

  createChatModel(modelId, temperature = 0.7) {
    const modelConfig = this.modelMap[modelId];
    
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const apiProvider = modelConfig.apiProvider;

    switch (apiProvider) {
      case 'openai':
        return new ChatOpenAI({
          model: modelId,
          temperature,
          openAIApiKey: process.env.OPENAI_API_KEY
        });

      case 'anthropic':
        return new ChatAnthropic({
          model: modelId,
          temperature,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY
        });

      case 'google':
        return new ChatGoogleGenerativeAI({
          model: modelId,
          temperature,
          apiKey: process.env.GOOGLE_API_KEY
        });

      case 'groq':
        return new ChatGroq({
          model: modelId,
          temperature,
          apiKey: process.env.GROQ_API_KEY
        });

      default:
        throw new Error(`Unknown API provider: ${apiProvider}`);
    }
  }

  convertToLangChainMessages(messages) {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  async chat(messages, modelId = 'gpt-4o-mini', temperature = 0.7, conversationId = null) {
    try {
      // Create the chat model
      const chatModel = this.createChatModel(modelId, temperature);

      // Convert messages to LangChain format
      const langChainMessages = this.convertToLangChainMessages(messages);

      // Invoke the model
      const response = await chatModel.invoke(langChainMessages);

      return {
        role: 'assistant',
        content: response.content
      };
    } catch (error) {
      console.error('LangChain chat error:', error);
      throw error;
    }
  }

  getAvailableModels() {
    const available = [];

    if (process.env.OPENAI_API_KEY) {
      this.modelConfigs.openai.forEach(model => {
        available.push(model);
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.modelConfigs.anthropic.forEach(model => {
        available.push(model);
      });
    }

    if (process.env.GOOGLE_API_KEY) {
      this.modelConfigs.google.forEach(model => {
        available.push(model);
      });
    }

    if (process.env.GROQ_API_KEY) {
      this.modelConfigs.groq.forEach(model => {
        available.push(model);
      });
    }

    return available;
  }
}

module.exports = new LangChainAIService();
