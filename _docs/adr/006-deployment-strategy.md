# ADR-006: Deployment Strategy — Docker Compose + PM2 Hybrid

**Date:** 2026-04-22  
**Status:** Accepted  
**Decider:** Steve Robinson  
**Context:** Deployment model for alpax-agent-zero-engine (local dev and production on Mac Mini)

---

## Context

The alpax-agent-zero-engine runs on Steve's Mac Mini (production target). We need:

1. **Local development:** Fast iteration, hot reload, easy debugging
2. **Production:** Stable, auto-restarting, log management, resource isolation

Evaluated options:
- **Docker Compose only** — good for isolation, but resource-heavy on Mac
- **PM2 only** — lightweight, but no network isolation for Agent Zero dependencies
- **Hybrid** — Docker Compose for Agent Zero + supporting services; PM2 for Next.js dashboard

---

## Decision

**Use Docker Compose for Agent Zero and its dependencies; PM2 for the Next.js dashboard in production.**

---

## Rationale

### Docker Compose for Agent Zero

Agent Zero and any supporting services (Redis for session state, optional MCP bridge) run in Docker:

```yaml
# docker-compose.yml (production)
services:
  agent-zero:
    image: agent-zero:latest
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MCP_KANBAN_URL=${MCP_KANBAN_URL}
    volumes:
      - agent-zero-data:/app/data
    restart: unless-stopped

  # Optional: Redis for session persistence
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  agent-zero-data:
  redis-data:
```

Benefits:
- Agent Zero's Python runtime and dependencies are fully isolated
- Easy to swap versions by changing the image tag
- Clean teardown and upgrade path
- Redis provides session durability across restarts

### PM2 for Next.js Dashboard

PM2 manages the Next.js production process:

```bash
# Start
pm2 start npm --name "alpax-dashboard" -- start

# Auto-restart on crash, keep alive
pm2 start npm --name "alpax-dashboard" -- start --max-memory-restart 1G
```

Benefits:
- Lightweight — no Docker overhead on Mac Mini
- Native process management with auto-restart
- Built-in log rotation (`pm2 logs`)
- Easy cluster mode if we need to scale later

### Development Mode

During development, use Next.js dev server directly:

```bash
npm run dev  # hot reload, no PM2
```

Docker services (Agent Zero, Redis) are started via `docker compose up -d`.

---

## Production Startup Sequence

```bash
# 1. Pull latest images and start backing services
docker compose up -d

# 2. Wait for Agent Zero to be healthy
curl -f http://localhost:8080/health || exit 1

# 3. Start/update Next.js dashboard
pm2 startOrRestart ecosystem.config.js
```

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `OPENAI_API_KEY` | Docker Compose `.env` | Agent Zero LLM calls |
| `AGENT_ZERO_URL` | PM2 / Next.js `.env.local` | Dashboard → Agent Zero |
| `MCP_KANBAN_URL` | Docker Compose `.env` | Kanban MCP tool |
| `NEXT_PUBLIC_APP_URL` | PM2 | CORS and redirect targets |

---

## Consequences

- **Positive:** Clean separation — Agent Zero's Python deps don't pollute the Mac Mini system.
- **Positive:** PM2 is lightweight and battle-tested on macOS.
- **Positive:** `docker compose down && docker compose up -d` = zero-downtime Agent Zero upgrade.
- **Negative:** Two process managers (Docker + PM2) — slightly more operational complexity.
- **Negative:** Docker on Mac Mini uses Colima — monitor CPU/memory usage.

---

## Monitoring

```bash
# Check both systems
docker compose ps        # Agent Zero + Redis status
pm2 status               # Dashboard status
pm2 logs alpax-dashboard # Dashboard logs
docker logs agent-zero   # Agent Zero logs
```

---

## References

- Docker Compose documentation
- PM2 documentation: https://pm2.keymetrics.io
- Colima (macOS container runtime): https://github.com/abiosoft/colima
