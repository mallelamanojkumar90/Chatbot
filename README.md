## AI Chat App with Multi-Model Support + LangChain

### Overview

This is a modern chat application powered by **LangChain** with support for multiple AI models:

- **Framework**: LangChain for unified AI interface and advanced features
- **Server**: Node.js + Express with LangChain integration
- **Client**: React (Vite) with model selector UI
- **Supported Models**:
  - **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
  - **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
  - **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
  - **Groq**: Llama 3.3 70B, Llama 3.1 70B, Llama 3.2 90B Vision, Mixtral 8x7B

### Prerequisites

- Node.js 18+
- At least one API key from:
  - OpenAI (https://platform.openai.com/api-keys)
  - Anthropic (https://console.anthropic.com/)
  - Google AI (https://makersuite.google.com/app/apikey)
  - Groq (https://console.groq.com/)

### Setup

1. Server

```
cd server
npm install
copy .env.example .env
# edit .env to set your API keys and ALLOWED_ORIGIN
npm run dev
```

The server defaults to port 3001. Health: `GET http://localhost:3001/api/health`.

2. Client

```
cd client
npm install
# Optional: create .env and set VITE_API_BASE=http://localhost:3001
npm run dev
```

Open `http://localhost:5173`. Select your preferred model from the dropdown and start chatting!

### Environment

- Server env file example: `server/.env.example`
  - `PORT=3001`
  - `ALLOWED_ORIGIN=http://localhost:5173`
  - `OPENAI_API_KEY=...` (optional)
  - `ANTHROPIC_API_KEY=...` (optional)
  - `GOOGLE_API_KEY=...` (optional)
  - `GROQ_API_KEY=...` (optional)
- Client env (optional): `client/.env`
  - `VITE_API_BASE=http://localhost:3001`

### Features

- **🦜 LangChain Powered**: Built on LangChain framework for advanced AI capabilities
- **Multi-Model Support**: Switch between different AI providers seamlessly
- **Conversation Memory**: LangChain memory support (ready to enable)
- **Customizable Models**: Configure which models appear via `.env` file
- **Conversation Management**: Create, switch, and delete conversations
- **Message History**: All conversations are saved locally
- **Dark Theme**: Modern, eye-friendly interface
- **Responsive Design**: Works on desktop and mobile
- **Extensible**: Easy to add RAG, agents, tools, and more

### Model Customization

You can customize which models are available by adding model configuration to your `.env` file:

```env
OPENAI_MODELS=[{"id":"gpt-4o","name":"GPT-4o","provider":"OpenAI"}]
ANTHROPIC_MODELS=[{"id":"claude-3-5-sonnet-20241022","name":"Claude Sonnet","provider":"Anthropic"}]
```

See `CUSTOM_MODELS_GUIDE.md` for detailed instructions on customizing models, names, and providers.

### LangChain Integration

This app is powered by **LangChain** - a framework for building AI applications. Benefits include:

- **Unified Interface**: Same code works with all AI providers
- **Conversation Memory**: Built-in memory management (ready to enable)
- **Extensible**: Easy to add RAG, agents, tools, streaming, and more
- **Production Ready**: Used by thousands of applications

See `LANGCHAIN_INTEGRATION.md` for detailed documentation and advanced features.

### Notes

- The app automatically detects which API keys are configured and shows only available models
- At least one API key must be configured for the app to work
- If model configurations are not specified, sensible defaults are used
- CORS is restricted to `ALLOWED_ORIGIN` for security
- LangChain provides a unified interface for all AI providers

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- OpenAI API key

### Quick Start with Docker Compose

1. **Set up environment variables:**

   ```bash
   # Create server/.env file
   cd server
   copy env.example .env
   # Edit .env and set your OPENAI_API_KEY
   ```

2. **Build and run with Docker Compose:**

   ```bash
   # From project root
   docker-compose up --build
   ```

3. **Access the application:**
   - Client: http://localhost:5173
   - Server API: http://localhost:3001

### Docker Commands

**Start services:**

```bash
docker-compose up -d
```

**Stop services:**

```bash
docker-compose down
```

**View logs:**

```bash
docker-compose logs -f
```

**Rebuild after code changes:**

```bash
docker-compose up --build
```

**Stop and remove volumes:**

```bash
docker-compose down -v
```

### Individual Container Deployment

**Build and run server:**

```bash
cd server
docker build -t chatbot-server .
docker run -p 3001:3001 -e OPENAI_API_KEY=your_key_here chatbot-server
```

**Build and run client:**

```bash
cd client
docker build --build-arg VITE_API_BASE=http://localhost:3001 -t chatbot-client .
docker run -p 80:80 chatbot-client
```

### Docker Architecture

- **Server Container**: Node.js 18 Alpine image running Express server
- **Client Container**: Multi-stage build (Node.js for build, Nginx for serving)
- **Network**: Both containers on `chatbot-network` bridge network
- **Health Checks**: Server includes health check endpoint monitoring

### Environment Variables

Set these in `server/.env` or pass via `docker-compose.yml`:

- `OPENAI_API_KEY` (required)
- `PORT=3001` (optional, defaults to 3001)
- `ALLOWED_ORIGIN=http://localhost:5173` (for local dev) or `http://localhost:8080` (for Docker setup)

### Production Considerations

1. **Use environment secrets** instead of `.env` files
2. **Configure reverse proxy** (nginx/traefik) for SSL/TLS
3. **Set up proper logging** and monitoring
4. **Use Docker secrets** for sensitive data
5. **Configure resource limits** in docker-compose.yml
6. **Use Docker volumes** for persistent data if needed
