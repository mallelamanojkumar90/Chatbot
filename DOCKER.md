# Docker Deployment Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Docker Architecture Overview](#docker-architecture-overview)
3. [Project Structure](#project-structure)
4. [Understanding the Dockerfiles](#understanding-the-dockerfiles)
5. [Docker Compose Configuration](#docker-compose-configuration)
6. [Step-by-Step Deployment](#step-by-step-deployment)
7. [How It Works](#how-it-works)
8. [Common Commands](#common-commands)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

---

## Introduction

### What is Docker?

Docker is a platform that uses containerization to package applications and their dependencies into lightweight, portable containers. Think of it as a shipping container for software - it ensures your application runs the same way everywhere.

### Why Use Docker for This Chatbot?

- **Consistency**: Runs the same on your machine, staging, and production
- **Isolation**: Server and client run in separate containers
- **Easy Deployment**: One command to start everything
- **Scalability**: Easy to scale individual services
- **Dependency Management**: All dependencies are bundled in containers

---

## Docker Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host Machine                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Docker Network: chatbot-network          │  │
│  │                                                   │  │
│  │  ┌──────────────────┐      ┌──────────────────┐ │  │
│  │  │  Server Container │      │  Client Container │ │  │
│  │  │                  │      │                  │ │  │
│  │  │  Node.js 18      │      │  Nginx Alpine    │ │  │
│  │  │  Express API     │◄─────┤  React App       │ │  │
│  │  │  Port: 3001      │      │  Port: 80        │ │  │
│  │  │                  │      │                  │ │  │
│  │  └──────────────────┘      └──────────────────┘ │  │
│  │         │                           │            │  │
│  └─────────┼───────────────────────────┼────────────┘  │
│            │                           │                │
│    ┌───────▼──────────┐      ┌────────▼──────────┐    │
│    │ localhost:3001   │      │  localhost:80     │    │
│    │ (API Endpoint)   │      │  (Web Interface)  │    │
│    └──────────────────┘      └───────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Container Communication Flow

```
User Browser
    │
    │ HTTP Request
    ▼
┌─────────────────┐
│ Client Container│ (Nginx serves React app)
│ Port 80         │
└────────┬────────┘
         │
         │ API Call: /api/chat
         ▼
┌─────────────────┐
│ Server Container│ (Express handles API)
│ Port 3001       │
└────────┬────────┘
         │
         │ OpenAI API Call
         ▼
    OpenAI Servers
```

---

## Project Structure

```
Chatbot/
│
├── docker-compose.yml          # Orchestrates both containers
├── .dockerignore               # Files to exclude from Docker builds
│
├── server/
│   ├── Dockerfile              # Server container definition
│   ├── .dockerignore           # Server-specific exclusions
│   ├── package.json
│   ├── .env                    # Environment variables (create this)
│   └── src/
│       ├── index.js            # Express server entry point
│       ├── routes/
│       │   └── chat.js         # Chat API endpoint
│       └── openaiClient.js     # OpenAI client setup
│
└── client/
    ├── Dockerfile              # Client container definition
    ├── .dockerignore           # Client-specific exclusions
    ├── nginx.conf              # Nginx configuration
    ├── package.json
    └── src/                    # React source code
```

---

## Understanding the Dockerfiles

### Server Dockerfile (`server/Dockerfile`)

```dockerfile
# Server Dockerfile
FROM node:18-alpine
```

**What this does:**
- Uses Node.js 18 on Alpine Linux (lightweight, ~5MB base image)
- Alpine is minimal and secure

```dockerfile
WORKDIR /app
```

**What this does:**
- Sets `/app` as the working directory inside the container
- All commands run from this directory

```dockerfile
# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production
```

**What this does:**
- Copies `package.json` and `package-lock.json`
- `npm ci` installs exact versions from lock file (faster, more reliable)
- `--only=production` skips dev dependencies (saves space)

```dockerfile
# Copy server source code
COPY . .
```

**What this does:**
- Copies all server files into the container
- `.dockerignore` prevents copying unnecessary files

```dockerfile
EXPOSE 3001
```

**What this does:**
- Documents that the container listens on port 3001
- Doesn't actually open the port (that's done in docker-compose)

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**What this does:**
- Checks server health every 30 seconds
- Calls `/api/health` endpoint
- Marks container as unhealthy if it fails 3 times

```dockerfile
CMD ["node", "src/index.js"]
```

**What this does:**
- Command that runs when container starts
- Starts the Express server

---

### Client Dockerfile (`client/Dockerfile`)

This uses a **multi-stage build** - two separate stages in one Dockerfile:

#### Stage 1: Builder

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci
```

**What this does:**
- Creates a temporary container with Node.js
- Installs ALL dependencies (including dev dependencies needed for build)

```dockerfile
# Copy source code
COPY . .

# Build argument for API base URL
ARG VITE_API_BASE=http://localhost:3001
ENV VITE_API_BASE=$VITE_API_BASE

# Build the application
RUN npm run build
```

**What this does:**
- Copies React source code
- Sets build-time environment variable for API URL
- Runs `npm run build` to create production build in `dist/` folder

#### Stage 2: Production

```dockerfile
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html
```

**What this does:**
- Starts fresh with Nginx (web server)
- Copies ONLY the built files from the builder stage
- Final image doesn't include Node.js or source code (much smaller!)

```dockerfile
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**What this does:**
- Copies custom Nginx config
- Exposes port 80 (standard HTTP port)
- Starts Nginx in foreground mode

**Why Multi-Stage Build?**
- Final image is ~20MB instead of ~200MB
- No Node.js or build tools in production image
- More secure (fewer attack surfaces)

---

### Nginx Configuration (`client/nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
```

**What this does:**
- Listens on port 80
- Serves files from `/usr/share/nginx/html` (where we copied the build)

```nginx
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
```

**What this does:**
- For React Router: if a file doesn't exist, serve `index.html`
- Allows client-side routing to work

```nginx
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
```

**What this does:**
- Caches static assets for 1 year
- Improves performance on repeat visits

---

## Docker Compose Configuration

### `docker-compose.yml` Explained

```yaml
version: '3.8'
```

**What this does:**
- Specifies Docker Compose file format version

```yaml
services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
```

**What this does:**
- Defines a service named "server"
- Builds from `./server` directory using `Dockerfile`

```yaml
    container_name: chatbot-server
    ports:
      - "3001:3001"
```

**What this does:**
- Names the container `chatbot-server`
- Maps host port 3001 to container port 3001
- Format: `"host:container"`

```yaml
    environment:
      - PORT=3001
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ALLOWED_ORIGIN=http://localhost:80
    env_file:
      - ./server/.env
```

**What this does:**
- Sets environment variables
- `${OPENAI_API_KEY}` reads from host environment
- `env_file` loads variables from `server/.env`

```yaml
    depends_on:
      server:
        condition: service_healthy
```

**What this does:**
- Client waits for server to be healthy before starting
- Prevents client from starting before server is ready

```yaml
networks:
  chatbot-network:
    driver: bridge
```

**What this does:**
- Creates a Docker network
- Containers can communicate using service names
- Isolated from other Docker networks

---

## Step-by-Step Deployment

### Prerequisites Check

```bash
# Check Docker installation
docker --version
# Should show: Docker version 20.x.x or higher

# Check Docker Compose
docker-compose --version
# Should show: docker-compose version 1.x.x or higher
```

### Step 1: Prepare Environment Variables

```bash
# Navigate to server directory
cd server

# Copy example environment file
copy env.example .env    # Windows
# OR
cp env.example .env      # Linux/Mac

# Edit .env file and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-api-key-here
```

**What's in `.env`?**
```
PORT=3001
OPENAI_API_KEY=sk-proj-...your-key...
ALLOWED_ORIGIN=http://localhost:80
```

### Step 2: Build and Start Containers

```bash
# From project root directory
docker-compose up --build
```

**What happens:**
1. Docker reads `docker-compose.yml`
2. Builds server image from `server/Dockerfile`
3. Builds client image from `client/Dockerfile`
4. Creates `chatbot-network`
5. Starts server container
6. Waits for server health check
7. Starts client container
8. Both containers run in foreground

**Expected output:**
```
Building server...
Step 1/7 : FROM node:18-alpine
...
Successfully built abc123def456

Building client...
Step 1/12 : FROM node:18-alpine AS builder
...
Successfully built xyz789uvw012

Creating chatbot-server ... done
Creating chatbot-client ... done

chatbot-server  | Server listening on http://localhost:3001
chatbot-client  | /docker-entrypoint.sh: Configuration complete; ready for start up
```

### Step 3: Access the Application

- **Web Interface**: Open http://localhost:80 in your browser
- **API Health Check**: http://localhost:3001/api/health

### Step 4: Run in Background (Optional)

```bash
# Stop current containers (Ctrl+C)
# Then run in detached mode
docker-compose up -d
```

**What `-d` does:**
- Runs containers in background (detached mode)
- Returns control to terminal
- Containers keep running

---

## How It Works

### Request Flow

1. **User opens browser** → http://localhost:80

2. **Nginx serves React app** → Returns `index.html` and JavaScript bundles

3. **React app loads** → Makes API call to `/api/chat`

4. **Request goes to server** → Express receives POST request

5. **Server calls OpenAI** → Sends messages to OpenAI API

6. **OpenAI responds** → Returns AI-generated message

7. **Server responds to client** → Sends JSON response

8. **React updates UI** → Displays AI response in chat

### Container Lifecycle

```
docker-compose up
    │
    ├─► Build Images (if needed)
    │   ├─► server/Dockerfile → server image
    │   └─► client/Dockerfile → client image
    │
    ├─► Create Network
    │   └─► chatbot-network
    │
    ├─► Start Server Container
    │   ├─► Run health check
    │   └─► Mark as healthy ✓
    │
    └─► Start Client Container
        └─► Serve static files via Nginx
```

---

## Common Commands

### Basic Operations

```bash
# Start containers
docker-compose up

# Start in background
docker-compose up -d

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs

# Follow logs (like tail -f)
docker-compose logs -f

# View logs for specific service
docker-compose logs server
docker-compose logs client
```

### Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a specific container
docker stop chatbot-server

# Start a stopped container
docker start chatbot-server

# Restart a container
docker restart chatbot-server

# Remove a container
docker rm chatbot-server

# Execute command in running container
docker exec -it chatbot-server sh
```

### Image Management

```bash
# List images
docker images

# Remove an image
docker rmi chatbot-server

# Remove all unused images
docker image prune -a
```

### Debugging

```bash
# Check container status
docker-compose ps

# Inspect container details
docker inspect chatbot-server

# View container resource usage
docker stats

# Access container shell
docker exec -it chatbot-server sh
docker exec -it chatbot-client sh
```

---

## Troubleshooting

### Problem: "Cannot connect to server"

**Symptoms:**
- Client loads but API calls fail
- Browser console shows CORS errors

**Solutions:**
1. Check if server is running:
   ```bash
   docker-compose ps
   ```

2. Check server logs:
   ```bash
   docker-compose logs server
   ```

3. Verify `ALLOWED_ORIGIN` in `server/.env`:
   ```
   ALLOWED_ORIGIN=http://localhost:80
   ```

4. Test server directly:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Problem: "Port already in use"

**Symptoms:**
- Error: `Bind for 0.0.0.0:3001 failed: port is already allocated`

**Solutions:**
1. Find what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```

2. Change port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3002:3001"  # Use 3002 on host instead
   ```

3. Update `ALLOWED_ORIGIN` if needed

### Problem: "OpenAI API key not found"

**Symptoms:**
- Server starts but API calls fail
- Logs show: "Missing OPENAI_API_KEY"

**Solutions:**
1. Verify `.env` file exists:
   ```bash
   ls server/.env
   ```

2. Check `.env` file content:
   ```bash
   cat server/.env  # Linux/Mac
   type server\.env  # Windows
   ```

3. Restart containers:
   ```bash
   docker-compose down
   docker-compose up
   ```

### Problem: "Client shows blank page"

**Symptoms:**
- Browser loads but shows white/blank page

**Solutions:**
1. Check client logs:
   ```bash
   docker-compose logs client
   ```

2. Verify build completed:
   ```bash
   docker exec -it chatbot-client ls /usr/share/nginx/html
   ```

3. Check browser console for errors (F12)

4. Rebuild client:
   ```bash
   docker-compose up --build client
   ```

### Problem: "Build fails"

**Symptoms:**
- `docker-compose up --build` fails with errors

**Solutions:**
1. Check Dockerfile syntax
2. Verify all files exist (package.json, etc.)
3. Check disk space: `docker system df`
4. Clear Docker cache:
   ```bash
   docker system prune -a
   ```

---

## Production Deployment

### Security Considerations

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use Docker secrets or environment variables

2. **Use HTTPS**
   - Add reverse proxy (Traefik, Nginx)
   - Use Let's Encrypt for SSL certificates

3. **Limit resources**
   ```yaml
   services:
     server:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

4. **Use Docker secrets** (Docker Swarm):
   ```yaml
   secrets:
     openai_key:
       external: true
   ```

### Production docker-compose.yml Example

```yaml
version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: chatbot-server
    restart: always
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
    networks:
      - chatbot-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE=${API_BASE_URL}
    container_name: chatbot-client
    restart: always
    depends_on:
      server:
        condition: service_healthy
    networks:
      - chatbot-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  chatbot-network:
    driver: bridge
```

### Deployment Platforms

**Docker Hub:**
```bash
# Build and tag
docker build -t yourusername/chatbot-server ./server
docker build -t yourusername/chatbot-client ./client

# Push to Docker Hub
docker push yourusername/chatbot-server
docker push yourusername/chatbot-client
```

**AWS ECS / Google Cloud Run / Azure Container Instances:**
- Use the same Dockerfiles
- Configure environment variables in platform settings
- Set up load balancers and auto-scaling

**Self-Hosted Server:**
```bash
# On your server
git clone https://github.com/yourusername/Chatbot.git
cd Chatbot
# Set environment variables
docker-compose up -d
```

---

## Summary

### Key Concepts

1. **Dockerfile** = Recipe for building a container image
2. **Image** = Snapshot of your application and dependencies
3. **Container** = Running instance of an image
4. **Docker Compose** = Tool to orchestrate multiple containers
5. **Multi-stage build** = Build in one container, run in another (smaller final image)

### Benefits

✅ **Consistency**: Same environment everywhere  
✅ **Isolation**: Services don't interfere with each other  
✅ **Portability**: Run on any machine with Docker  
✅ **Scalability**: Easy to scale individual services  
✅ **Version Control**: Dockerfiles are versioned with your code  

### Next Steps

1. ✅ Understand the Dockerfiles
2. ✅ Learn Docker Compose commands
3. ✅ Deploy locally
4. 🔄 Set up CI/CD pipeline
5. 🔄 Deploy to production
6. 🔄 Set up monitoring and logging

---

## Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Happy Dockerizing! 🐳**

