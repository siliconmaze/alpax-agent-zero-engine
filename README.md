# Alpax Agent Zero Dashboard Engine

Agent Zero AI agent dashboard — Kanban board, observability, memory explorer, and command palette.

**Design:** Same look-and-feel as openclaw-ops-engine (dark Tailwind theme, Kanban lanes, activity icons, priority badges).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure Agent Zero
cp .env.example .env.local
# Edit .env.local with your Agent Zero API URL and key

# 3. Start Agent Zero (Docker)
cd agent-zero/docker/run && docker-compose up -d

# 4. Start dashboard
npm run dev
# Dashboard → http://localhost:4001
```

---

## Architecture

```
alpax-agent-zero-engine/
├── agent-zero/          ← Agent Zero Python framework (submodule)
├── src/
│   ├── app/
│   │   ├── page.tsx          ← Main dashboard (Kanban + panels)
│   │   ├── api/agent-zero/  ← API routes (health, message, projects)
│   │   └── settings/         ← Settings panel
│   ├── components/ops/
│   │   ├── KanbanLane.tsx    ← Lane column (Now/Backlog/Done/etc.)
│   │   └── CardItem.tsx      ← Card display (priority, model, AZ context)
│   └── lib/
│       ├── agent-zero-client.ts  ← Typed API client
│       ├── store.ts          ← Zustand state
│       ├── types.ts         ← TypeScript types
│       └── utils.ts         ← lane/priority colors, helpers
├── _docs/
│   ├── agent-zero-api-research.md  ← Full API documentation
│   └── adr/                      ← Architecture Decision Records
└── agent-zero/              ← Agent Zero framework (from agent0ai/agent-zero)
```

## Features

- **Kanban Board** — Cards mapped to Agent Zero sessions (context_id)
- **Sessions Panel** — Live Agent Zero session management
- **Observability** — Token counter, cost estimation, latency tracking
- **Memory Dashboard** — Per-project memory explorer (future)
- **Command Palette** — Cmd+K for quick actions
- **Settings** — API URL, key, model config, notifications

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS (dark slate theme)
- lucide-react icons
- Zustand (state)
- React Query (server state)

## Agent Zero API

Agent Zero exposes a full REST API. Dashboard connects via `src/lib/agent-zero-client.ts`.

Key endpoints:
- `POST /api/message` — Send message, create/continue session
- `POST /api/projects` — Manage projects
- `GET /api/health` — Health check
- `POST /api/history_get` — Chat history

See `_docs/agent-zero-api-research.md` for full API documentation.

## Ports

| Service | Port |
|---------|------|
| Dashboard | 4001 |
| Agent Zero (Docker) | 50080 |
| Agent Zero (direct) | 80 |

## Development

```bash
npm run dev        # Dev server on 4001
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Playwright E2E tests
```

## License

MIT — Steve's agent infrastructure
