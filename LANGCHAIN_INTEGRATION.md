# 🦜 LangChain Integration

## Overview

Your chatbot now uses **LangChain** - a powerful framework for building AI applications! This gives you advanced features like conversation memory, prompt templates, and easier model management.

## 🎯 What is LangChain?

LangChain is a framework that makes it easier to build applications with Large Language Models (LLMs). It provides:

- **Unified Interface**: Work with different AI providers using the same code
- **Conversation Memory**: Remember context across messages
- **Prompt Templates**: Reusable, configurable prompts
- **Chains**: Combine multiple AI operations
- **Agents**: Build autonomous AI agents

## ✨ Features Added

### 1. **Unified Model Interface**

All AI providers (OpenAI, Anthropic, Google, Groq) now use the same LangChain interface:

```javascript
const response = await langchainService.chat(messages, modelId, temperature);
```

### 2. **Conversation Memory** (Ready to Use)

LangChain can remember conversation context automatically:

```javascript
// With memory - remembers previous messages
const response = await langchainService.chatWithMemory(
  userMessage,
  modelId,
  temperature,
  conversationId
);
```

### 3. **Memory Management**

Clear conversation memory when starting a new chat:

```javascript
// API endpoint: DELETE /api/chat/memory/:conversationId
langchainService.clearMemory(conversationId);
```

## 🏗️ Architecture

### Before (Direct API Calls)

```
Frontend → Express → OpenAI/Anthropic/Google/Groq APIs
```

### After (LangChain)

```
Frontend → Express → LangChain → OpenAI/Anthropic/Google/Groq APIs
                        ↓
                   Memory, Chains, Prompts
```

## 📁 Files Changed

### Backend

- ✅ **`server/src/services/langchainService.js`** - New LangChain service
- ✅ **`server/src/routes/chat.js`** - Updated to use LangChain
- ✅ **`package.json`** - Added LangChain dependencies

### Frontend

- ✅ **`client/src/App.jsx`** - Sends conversation ID for memory

## 🚀 Usage Examples

### Basic Chat (Current Implementation)

```javascript
// This is what's currently running
const response = await langchainService.chat(
  messages, // Array of {role, content}
  "gpt-4o", // Model ID
  0.7, // Temperature
  conversationId // For future memory features
);
```

### With Conversation Memory (Available)

```javascript
// You can switch to this for automatic memory
const response = await langchainService.chatWithMemory(
  "What did I ask before?", // User message
  "gpt-4o", // Model ID
  0.7, // Temperature
  "conversation-123" // Conversation ID
);
```

## 🎨 Advanced Features You Can Add

### 1. **Custom Prompt Templates**

```javascript
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const template = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful coding assistant."],
  ["human", "{input}"],
]);
```

### 2. **Streaming Responses**

```javascript
const stream = await chatModel.stream(messages);
for await (const chunk of stream) {
  console.log(chunk.content);
}
```

### 3. **RAG (Retrieval Augmented Generation)**

```javascript
// Add vector stores and retrievers
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require("@langchain/openai");
```

### 4. **Agents with Tools**

```javascript
// Create AI agents that can use tools
const { AgentExecutor } = require("langchain/agents");
const { Calculator } = require("langchain/tools/calculator");
```

## 📊 Benefits

| Feature               | Before                           | With LangChain        |
| --------------------- | -------------------------------- | --------------------- |
| **Code Complexity**   | Different code for each provider | Unified interface     |
| **Memory**            | Manual implementation needed     | Built-in              |
| **Streaming**         | Manual implementation            | Built-in              |
| **Prompt Management** | Hardcoded strings                | Reusable templates    |
| **Extensibility**     | Limited                          | Chains, agents, tools |

## 🔧 Configuration

### Environment Variables

No changes needed! LangChain uses the same API keys:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
```

### Model Configuration

Works with your existing model configuration:

```env
OPENAI_MODELS=[{"id":"gpt-4o","name":"GPT-4o","provider":"OpenAI"}]
GROQ_MODELS=[{"id":"llama-3.3-70b-versatile","name":"Llama 3.3 70B","provider":"Groq"}]
```

## 🎯 Next Steps

### Enable Conversation Memory

To enable automatic conversation memory, update `chat.js`:

```javascript
// Change from:
const response = await langchainService.chat(
  messages,
  selectedModel,
  0.7,
  conversationId
);

// To:
const response = await langchainService.chatWithMemory(
  messages[messages.length - 1].content, // Last user message
  selectedModel,
  0.7,
  conversationId
);
```

### Add Streaming

Update the service to support streaming responses:

```javascript
async chatStream(messages, modelId, temperature) {
  const chatModel = this.createChatModel(modelId, temperature);
  const stream = await chatModel.stream(messages);
  return stream;
}
```

### Add Custom Prompts

Create reusable prompt templates:

```javascript
const codingPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are an expert programmer. Provide clear, well-commented code.",
  ],
  ["human", "{input}"],
]);
```

## 📚 Resources

- **LangChain Docs**: https://js.langchain.com/docs/
- **LangChain GitHub**: https://github.com/langchain-ai/langchainjs
- **Tutorials**: https://js.langchain.com/docs/tutorials/

## 🎉 Summary

Your chatbot now runs on **LangChain**, giving you:

✅ **Unified interface** for all AI providers  
✅ **Built-in conversation memory** (ready to enable)  
✅ **Extensible architecture** for advanced features  
✅ **Production-ready** framework used by thousands of apps  
✅ **Same functionality** as before, but more powerful

The app works exactly the same from the user's perspective, but now you have a solid foundation to add advanced AI features! 🚀
