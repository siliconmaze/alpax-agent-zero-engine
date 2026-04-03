# Changelog

## [0.0.2] — 2026-04-03

### Added
- **Setup guide** — `_docs/guides/setup.md` with full stack instructions (Agent Zero + Dashboard + Z.AI GLM 5.1)
- **Z.AI / GLM 5.1 support** — `ZAI_API_KEY` in `.env.example` and `docker-compose.yml`

### Fixed
- Docker image corrected from `agentzero/agent-zero` to `agent0ai/agent-zero:latest`
- Agent Zero port mapping fixed to `50080:80` (matching upstream docker-compose)
- All services bound to `0.0.0.0` for network accessibility
- Postgres remapped to port `5434` to avoid conflicts with existing instances
- Next.js dev/prod server binds to `0.0.0.0` via `-H` flag

### Changed
- `docker-compose.yml` — correct image, ports, volume mount (`/a0`), Z.AI env passthrough
- `bin/start` — binds to `0.0.0.0` in both dev and prod modes

## [0.0.1] — 2026-04-03

### Added
- **Bin scripts** — `bin/start`, `bin/stop`, `bin/restart`, `bin/status` following openclaw-ops-engine patterns
  - Environment loading from `.env` / `.env.local`
  - Port cleanup via `lsof`/`ss` (PM2-safe — only targets `agent-zero-engine`)
  - Agent Zero connectivity check on startup
  - Background restart with nohup logging to `~/.alpaxprime/`
- **Playwright E2E tests** — 46 tests across 8 suites
  - Dashboard load, Kanban board, Sessions panel, Command palette
  - Settings panel, Observability widgets, Memory view, Navigation
  - Route-level API mocks via `page.route()` (no MSW worker needed)
- **Observability widgets** — `TokensWidget`, `LatencyWidget`, `CostWidget`, `ModelUsageWidget`
- **Architecture Decision Records** — ADR-001 through ADR-006
- **Agent Zero API client** — typed HTTP client with retry, mock mode, token parsing

### Changed
- `package.json` scripts now use `bin/start` wrapper for `dev` and `start`
- Added `stop`, `restart`, `status` npm scripts

## [0.0.0] — 2026-03-31

### Added
- Initial Next.js 15 dashboard scaffold on port 4001
- Kanban board with 6 lanes (Now, Next, Backlog, Halted, Done, Recurring)
- Agent Sessions panel with create/chat/delete
- Command palette (Cmd+K)
- Settings panel with Agent Zero connection config
- Zustand state management with localStorage persistence
- Dark theme with Slate/Cyan palette
