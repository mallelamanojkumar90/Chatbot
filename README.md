## ChatGPT-like Chat App (React + Node + OpenAI)

### Overview
This is a minimal ChatGPT-style chat application:
- Server: Node.js + Express proxy to OpenAI
- Client: React (Vite) with a ChatGPT-like UI

### Prerequisites
- Node.js 18+
- An OpenAI API key

### Setup

1) Server

```
cd server
npm install
copy env.example .env
# edit .env to set OPENAI_API_KEY and ALLOWED_ORIGIN
npm run dev
```

The server defaults to port 3001. Health: `GET http://localhost:3001/api/health`.

2) Client

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


