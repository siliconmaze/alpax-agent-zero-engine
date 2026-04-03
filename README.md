# Alpax Agent Zero Engine

Production deployment stack for the Alpax Agent Zero platform — dashboard, agent runtime, session state, and observability data.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   alpax-agent-net                     │
│                                                       │
│  ┌─────────────┐   ┌──────────────┐                  │
│  │  dashboard  │──▶│   postgres   │                  │
│  │ (Next.js    │   │  (observability)                │
│  │  :4001)     │   └──────────────┘                  │
│  └──────┬──────┘                                     │
│         │                                             │
│  ┌──────▼──────┐   ┌──────────────┐                  │
│  │ agent-zero  │◀──│    redis     │                  │
│  │  (:5000)    │   │ (sessions)   │                  │
│  └─────────────┘   └──────────────┘                  │
└──────────────────────────────────────────────────────┘
```

**Services**
| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `dashboard` | Next.js (custom) | 4001 | Web UI + REST API |
| `agent-zero` | agentzero/agent-zero:latest | 5000 | AI agent runtime |
| `redis` | redis:7-alpine | 6379 | Session/state store |
| `postgres` | postgres:16-alpine | 5432 | Observability data |

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/siliconmaze/alpax-agent-zero-engine.git
cd alpax-agent-zero-engine

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set AGENT_ZERO_API_KEY, POSTGRES_PASSWORD, etc.

# 3. Start the stack
docker compose up -d

# Verify
curl http://localhost:4001/api/health
```

## API Reference

### Health
```
GET /api/health
→ 200 { status: "ok", uptime: <seconds>, timestamp: <ISO> }
```

### Agent Zero Proxy
```
POST /api/agent/execute
Body: { prompt: string, context?: object }
→ { result: string, sessionId: string }

GET  /api/agent/sessions
→ { sessions: Session[] }

DELETE /api/agent/sessions/:id
→ 204 No Content
```

### Sessions (Redis-backed)
```
POST /api/sessions
Body: { userId: string, metadata?: object }
→ { sessionId: string, createdAt: string }

GET /api/sessions/:sessionId
→ { sessionId, userId, data: object, createdAt, updatedAt }

PATCH /api/sessions/:sessionId
Body: { data: object }
→ { sessionId, updatedAt: string }
```

## Production Deployment (PM2)

```bash
# Install dependencies
npm ci

# Copy env
cp .env.example .env.local

# Build
npm run build

# Start with PM2 (2 instances, cluster mode)
pm2 start ecosystem.config.cjs --env production

# Logs
pm2 logs alpax-agent-zero-dashboard

# Reload after update
pm2 reload alpax-agent-zero-dashboard
```

## Troubleshooting

**Dashboard returns 502**
→ Check `agent-zero` is healthy: `docker compose ps agent-zero`

**Redis connection refused**
→ Wait for Redis health check: `docker compose up -d redis` then `docker compose up -d`

**Postgres auth failed**
→ Set matching `POSTGRES_PASSWORD` in `.env.local` and `docker-compose.yml`

**Build fails on M1/M2 Mac**
→ Add `platform: linux/amd64` to the `dashboard` build section in `docker-compose.yml`

**Increase agent-zero timeout**
→ Set `AGENT_ZERO_TIMEOUT=120` in the `agent-zero` service environment

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_ZERO_API_URL` | `http://agent-zero:5000` | Agent Zero endpoint |
| `AGENT_ZERO_API_KEY` | *(empty)* | API key for agent auth |
| `DATABASE_URL` | `postgresql://...` | Postgres connection string |
| `POSTGRES_PASSWORD` | `changeme` | Postgres password |
| `REDIS_URL` | `redis://redis:6379` | Redis connection URL |
| `PORT` | `4001` | Dashboard port |
| `NODE_ENV` | `production` | Runtime environment |
| `TELEGRAM_BOT_TOKEN` | *(empty)* | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | *(empty)* | Telegram webhook URL |

## License

MIT — siliconmaze
