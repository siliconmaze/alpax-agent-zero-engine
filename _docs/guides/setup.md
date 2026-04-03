# Alpax Agent Zero Engine — Setup Guide

This guide gets the full stack running locally: Agent Zero core, the Alpax dashboard, Redis, and Postgres — with Z.AI GLM 5.1 as the default model.

## Prerequisites

- macOS (tested on Mac Mini)
- Docker Desktop installed and running
- Node.js 20+ and npm
- A Z.AI API key from [https://z.ai](https://z.ai) (or [https://open.bigmodel.cn](https://open.bigmodel.cn))

## 1. Clone and install

```bash
git clone git@github.com:siliconmaze/alpax-agent-zero-engine.git
cd alpax-agent-zero-engine
npm install
```

## 2. Configure environment

Copy the example env and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# ── Agent Zero Core ──────────────────────────────────────────────────────────
AGENT_ZERO_API_URL=http://localhost:50080
AGENT_ZERO_API_KEY=your-agent-zero-api-key

# ── Z.AI (GLM 5.1) ──────────────────────────────────────────────────────────
ZAI_API_KEY=your-zai-api-key-here

# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/agentzero
POSTGRES_PASSWORD=changeme

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Dashboard ─────────────────────────────────────────────────────────────────
PORT=4001
NODE_ENV=development
```

> **Where to get your Z.AI API key:** Sign up at [z.ai](https://z.ai), go to API Keys, and generate one. This is the same platform as Zhipu/BigModel — Z.AI is the international endpoint.

## 3. Start the stack

### Option A: Docker Compose (recommended for first run)

This starts Agent Zero, Redis, and Postgres in containers, then the dashboard locally:

```bash
# Start infrastructure + Agent Zero core
docker compose up -d

# Wait for services to be healthy
docker compose ps

# Start the dashboard in dev mode
npm run dev
```

### Option B: Full Docker (production-like)

```bash
docker compose --profile dashboard up -d
```

### Option C: Dashboard only (Agent Zero already running elsewhere)

```bash
npm run dev
```

## 4. Configure GLM 5.1 as the default model

Once the stack is running:

1. Open the **Agent Zero UI** at [http://localhost:50080](http://localhost:50080)
2. Go to **Settings** (gear icon)
3. Under **Chat Model**:
   - **Provider:** Z.AI
   - **Model:** `glm-5.1`
   - **API Key:** paste your `ZAI_API_KEY`
4. Under **Utility Model** (used for smaller tasks):
   - **Provider:** Z.AI
   - **Model:** `glm-5.1` (or `glm-4-flash` for cheaper utility calls)
5. Under **Embedding Model**:
   - **Provider:** OpenAI (or keep default — Z.AI doesn't serve embeddings via the same endpoint)
6. Click **Save**

> **How it works:** Agent Zero uses LiteLLM under the hood. The `zai` provider in `model_providers.yaml` maps to the OpenAI-compatible endpoint at `https://api.z.ai/api/paas/v4`. Your API key is sent as the bearer token.

## 5. Verify everything is connected

### Check Agent Zero is running
```bash
curl http://localhost:50080/api/health
```

### Check dashboard is running
```bash
npm run status
# or open http://localhost:4001
```

### Check dashboard can reach Agent Zero
Open [http://localhost:4001](http://localhost:4001) — the header should show **"Agent Zero Connected"** with a green badge.

### Send a test message
1. Go to the **Sessions** tab
2. Click **New** → name it `test` → **Create**
3. Type a message and hit **Send**
4. You should get a response from GLM 5.1 via Agent Zero

## 6. Stopping and restarting

```bash
# Stop everything
npm run stop              # stops the dashboard
docker compose down       # stops Agent Zero + infra

# Restart dashboard only
npm run restart

# Check status
npm run status
docker compose ps
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  http://localhost:4001                               │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  Alpax Dashboard (Next.js)           port 4001      │
│  src/app/api/agent-zero/*  ← proxy routes           │
└──────────────┬──────────────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────────────┐
│  Agent Zero Core (Docker)            port 50080      │
│  LiteLLM → Z.AI provider → GLM 5.1                 │
│  Memory, tools, MCP, A2A                            │
└──────────────┬───────────────┬──────────────────────┘
               │               │
┌──────────────▼───┐  ┌───────▼──────────────────────┐
│  Redis            │  │  PostgreSQL                   │
│  port 6379        │  │  port 5434                    │
└──────────────────┘  └──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  Z.AI API (GLM 5.1)                                 │
│  https://api.z.ai/api/paas/v4                       │
└─────────────────────────────────────────────────────┘
```

## Updating Agent Zero

Agent Zero runs as a Docker image. To update:

```bash
# Pull the latest image
docker compose pull agent-zero

# Restart just Agent Zero (data volumes are preserved)
docker compose up -d agent-zero
```

Your settings (model config, API keys) are stored in the `agent-zero-data` Docker volume and survive updates.

To pin a specific version instead of `:latest`:
```yaml
# docker-compose.yml
agent-zero:
  image: agent0ai/agent-zero:v1.6
```

## Updating the Dashboard

```bash
git pull
npm install
npm run restart
```

## Ports reference

| Service          | Port  | URL                          |
|------------------|-------|------------------------------|
| Dashboard        | 4001  | http://0.0.0.0:4001          |
| Agent Zero       | 50080 | http://0.0.0.0:50080         |
| PostgreSQL       | 5434  | postgresql://localhost:5434   |
| Redis            | 6379  | redis://localhost:6379        |

## Troubleshooting

### "Not Connected" badge in dashboard
- Check Agent Zero is running: `docker compose ps`
- Check the `AGENT_ZERO_API_URL` in `.env.local` matches the Agent Zero port
- For Docker: use `http://localhost:50080` (not `http://agent-zero:80` — that's for container-to-container)

### Agent Zero returns errors for GLM 5.1
- Verify your `ZAI_API_KEY` is valid at [https://z.ai](https://z.ai)
- Check you selected provider **Z.AI** (not "Other OpenAI compatible")
- Check Agent Zero logs: `docker compose logs agent-zero`

### Dashboard won't start
- Check port 4001 is free: `npm run status`
- Check Node version: `node -v` (needs 20+)
- Try a clean install: `rm -rf node_modules .next && npm install`
