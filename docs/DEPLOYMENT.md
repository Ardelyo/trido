# Deployment Guide

## Prerequisites

- Docker installed (for containerized deployment)
- Node.js 18+ (for source deployment)
- Gemini API key (for cloud mode)
- Ollama installed on target machine (optional, for offline mode)

## Local Production Deployment

### 1. Build the Application

```bash
npm run build
```

This creates an optimized bundle in `dist/` folder (~2-3 MB).

### 2. Start the Server

```bash
# Using npm
npm start

# Or directly with tsx
tsx server.ts
```

The application will be available at `http://localhost:3000`.

**Verify it's running:**
```bash
curl http://localhost:3000
```

### 3. Environment Setup

Create `.env.local` with production values:

```
VITE_GEMINI_API_KEY=your_production_key_here
OLLAMA_URL=http://localhost:11434
SERVER_PORT=3000
```

**Important for production:**
- Use a strong, unique Gemini API key
- Restrict API key to your domain if using web-based auth
- Store sensitive keys in environment variables, not in code
- Consider using a secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)

---

## Docker Deployment

### Multi-Stage Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
COPY server.ts constants.ts types.ts ./
COPY server/ ./server/
COPY utils/ ./utils/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "--loader", "tsx", "server.ts"]
```

### Build Docker Image

```bash
docker build -t smartboard-teach-ai:latest .
```

### Run Container Locally

```bash
docker run -p 3000:3000 \
  -e VITE_GEMINI_API_KEY=your_key \
  -e NODE_ENV=production \
  smartboard-teach-ai:latest
```

Access at `http://localhost:3000`.

### Docker Compose (Development)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
      - OLLAMA_URL=http://ollama:11434
      - NODE_ENV=production
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    command: serve

volumes:
  ollama_data:
```

**Start both services:**
```bash
docker-compose up
```

This starts both the app and Ollama; app will automatically detect Ollama at `http://ollama:11434`.

---

## Cloud Deployment

### Azure App Service

#### Option 1: Deploy from Docker Image

```bash
# Push Docker image to Azure Container Registry
az acr build --registry myregistry --image smartboard-teach-ai:latest .

# Create App Service
az appservice plan create \
  --name smartboard-plan \
  --resource-group mygroup \
  --sku B2 --is-linux

az webapp create \
  --resource-group mygroup \
  --plan smartboard-plan \
  --name smartboard-app \
  --deployment-container-image-name myregistry.azurecr.io/smartboard-teach-ai:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group mygroup \
  --name smartboard-app \
  --settings VITE_GEMINI_API_KEY=your_key NODE_ENV=production
```

#### Option 2: Deploy from Source (GitHub)

1. Push code to GitHub repository
2. Connect App Service to GitHub:
   ```bash
   az webapp deployment github-actions add \
     --repo YourUsername/smartboard-teach-ai \
     --resource-group mygroup \
     --name smartboard-app
   ```
3. App Service auto-deploys on push to main branch

### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/smartboard-teach-ai

# Deploy
gcloud run deploy smartboard-teach-ai \
  --image gcr.io/PROJECT_ID/smartboard-teach-ai \
  --platform managed \
  --region us-central1 \
  --set-env-vars VITE_GEMINI_API_KEY=your_key,NODE_ENV=production \
  --memory 512Mi \
  --timeout 3600
```

### AWS ECS (Elastic Container Service)

```bash
# Create ECR repository
aws ecr create-repository --repository-name smartboard-teach-ai

# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t smartboard-teach-ai:latest .
docker tag smartboard-teach-ai:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/smartboard-teach-ai:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/smartboard-teach-ai:latest

# Create ECS task definition (save as task-definition.json)
# Then register it
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

---

## Scaling Considerations

### Session Storage

By default, room state persists to `rooms_persistence.json` on the server's filesystem. For multi-server deployments, use a shared storage:

**Option 1: Shared File System (NFS)**
```typescript
// In server.ts
const ROOMS_FILE = '/shared-storage/rooms_persistence.json';
```

**Option 2: Redis-backed State**
```typescript
// server/redisStore.ts (example)
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

export async function saveRooms(rooms: Map<string, RoomState>) {
  const data = JSON.stringify(Array.from(rooms.entries()));
  await client.set('rooms', data);
}

export async function loadRooms(): Promise<Map<string, RoomState>> {
  const data = await client.get('rooms');
  return data ? new Map(JSON.parse(data)) : new Map();
}
```

### Load Balancing

For multiple instances behind a load balancer, enable Socket.IO adapter:

```bash
npm install @socket.io/redis-adapter
```

**In server.ts:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import redis from 'redis';

const pubClient = redis.createClient({ host: process.env.REDIS_HOST });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

This allows Socket.IO events to sync across multiple server instances.

---

## Monitoring & Logging

### Application Performance Monitoring (APM)

**Azure Application Insights:**
```bash
npm install applicationinsights
```

**In server.ts:**
```typescript
import appInsights from 'applicationinsights';

appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATION_KEY)
  .setAutoCollectConsole(true)
  .start();
```

### Structured Logging

Already implemented in `utils/logger.ts`:

```typescript
import { createLogger } from './utils/logger';
const logger = createLogger('module-name');

logger.info('User action', { userId: '123', action: 'created_mindmap' });
logger.error('API error', { status: 500, endpoint: '/api/generate' });
```

**In production**, configure log aggregation:
- Azure: Application Insights
- AWS: CloudWatch
- Google Cloud: Cloud Logging
- Self-hosted: ELK Stack, Loki, etc.

### Health Checks

Health check endpoint is available at `/health`:

```bash
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"2024-01-15T10:30:00Z"}
```

Configure your load balancer/orchestrator to periodically check this endpoint.

---

## Performance Tuning for Production

### 1. Enable Compression

```typescript
// In server.ts
import compression from 'compression';
app.use(compression());
```

### 2. Set Proper Node.js Flags

```bash
NODE_ENV=production node --max-old-space-size=2048 server.ts
```

### 3. Use Production AI Settings

Update `constants.ts` for slower but cheaper inference:

```typescript
export const CONFIG = {
  ai: {
    gemini: {
      generation: {
        temperature: 0.5,  // Lower = more deterministic
        maxOutputTokens: 1024,  // Reduce for faster responses
      },
    },
    ollama: {
      numCtx: 2048,  // Reduce context window for faster processing
    },
  },
};
```

### 4. Database Indexing (if using SQL backend)

If you switch from file-based storage to a database, ensure proper indexes:

```sql
CREATE INDEX idx_rooms_id ON rooms(id);
CREATE INDEX idx_canvas_objects_room_id ON canvas_objects(room_id);
```

---

## SSL/TLS Configuration

### Behind Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name smartboard.yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

### Let's Encrypt (Free SSL)

```bash
certbot certonly --standalone -d smartboard.yourdomain.com
```

---

## Database Migration (Optional)

To persist room data to a proper database instead of `rooms_persistence.json`:

**Example: PostgreSQL**

1. Install driver:
```bash
npm install pg
```

2. Create schema:
```sql
CREATE TABLE rooms (
  id VARCHAR PRIMARY KEY,
  canvas_state JSONB NOT NULL,
  viewports JSONB,
  dom_elements JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

3. Update `server.ts` to query database instead of filesystem.

---

## Rollback Procedure

If a deployment goes wrong:

```bash
# Keep previous Docker image tagged
docker tag smartboard-teach-ai:latest smartboard-teach-ai:v1.2.0

# Deploy previous version
docker run -p 3000:3000 smartboard-teach-ai:v1.2.0
```

For cloud platforms:
- **Azure App Service**: Use Deployment Slots for blue/green deployment
- **Google Cloud Run**: Each deployment is immutable; rollback is instant
- **AWS ECS**: Update service to point to previous task definition

---

## Disaster Recovery

### Backup Room Data

```bash
# Automated daily backup
0 2 * * * cp /app/rooms_persistence.json /backups/rooms_$(date +\%Y\%m\%d).json

# Or use cloud storage
aws s3 cp rooms_persistence.json s3://my-bucket/backups/rooms_$(date +%Y%m%d).json
```

### Recovery Process

```bash
# Restore from backup
cp /backups/rooms_20240115.json /app/rooms_persistence.json
npm start
```

---

## Troubleshooting Deployment

### Application Won't Start

```bash
# Check logs
docker logs container_id

# Or tail logs
npm run dev 2>&1 | tee deployment.log
```

Common issues:
- Missing environment variables → Set `VITE_GEMINI_API_KEY`
- Port already in use → Change `SERVER_PORT`
- Node version too old → Upgrade to 18+

### High Memory Usage

```bash
# Monitor memory
docker stats container_id

# Reduce canvas state size
# Consider caching/pagination for large sessions
```

### Socket.IO Connection Issues

- Verify CORS settings in server.ts
- Check firewall allows WebSocket connections (port 3000)
- Ensure `/socket.io` is not blocked by reverse proxy

---

## Recommended Deployment Architecture

```
Load Balancer (Port 80/443)
    ↓
API Gateway (Optional, for rate limiting)
    ↓
Reverse Proxy (Nginx/HAProxy)
    ↓
App Instances (2-3 copies)
    ↓
Redis (for session sync)
    ↓
Shared Storage / Database (for room state)
```

This setup enables:
- Zero-downtime deployments
- Horizontal scaling
- High availability
- Easy monitoring

---

