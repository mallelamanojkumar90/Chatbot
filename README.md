## ChatGPT-like Chat App (React + Node + OpenAI)

### Overview

This is a minimal ChatGPT-style chat application:

- Server: Node.js + Express proxy to OpenAI
- Client: React (Vite) with a ChatGPT-like UI

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Setup

1. Server

```
cd server
npm install
copy env.example .env
# edit .env to set OPENAI_API_KEY and ALLOWED_ORIGIN
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

Open `http://localhost:5173`. Type a message and press Send.

### Environment

- Server env file example: `server/env.example`
  - `PORT=3001`
  - `OPENAI_API_KEY=...`
  - `ALLOWED_ORIGIN=http://localhost:5173`
- Client env (optional): `client/.env`
  - `VITE_API_BASE=http://localhost:3001`

### Notes

- The server uses the `chat.completions` API with `model: gpt-4o-mini`. Change in `server/src/routes/chat.js` if desired.
- CORS is restricted to `ALLOWED_ORIGIN`.

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
