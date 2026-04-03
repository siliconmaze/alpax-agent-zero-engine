# ADR-002: Dashboard Architecture — Monolithic Next.js

**Date:** 2026-04-22  
**Status:** Accepted  
**Decider:** Steve Robinson  
**Context:** Frontend and backend architecture for the alpax-agent-zero-engine dashboard

---

## Context

The agent runtime needs a UI for:
- Viewing active agent sessions
- Monitoring token usage and costs
- Inspecting memory/context state
- Starting/stopping/resuming sessions
- Configuring MCP tool connections

We need to decide whether to:
- **Option A:** Monolithic Next.js app (same repo, API routes + React components)
- **Option B:** Separate frontend and backend repos with a dedicated API gateway

---

## Decision

**Adopt a monolithic Next.js app** in the same repository.

---

## Rationale

### Consistency with ops-engine

Our ops-engine already uses the monolithic Next.js pattern. Staff familiarity, shared tooling, and reusable patterns (auth, API client utilities, UI components) all apply.

### Simpler deployment

One repo, one deployment target. No cross-repo CI/CD complexity for feature development.

### API Routes as Backend

Next.js API routes (`/app/api/`) serve as the backend layer, proxying requests to Agent Zero's REST API. This keeps credentials server-side and provides a stable internal interface for the React frontend.

### Developer Velocity

Iterating on features like session cards, memory visualizers, and cost dashboards is faster in a unified codebase.

### Trade-offs Accepted

- Next.js serverless functions have execution time limits — mitigated by offloading long-running agent tasks to Agent Zero itself (not the API route).
- Monolith scale risk is low for a single-team internal tool.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js App                   │
│  ┌─────────────────────────────────┐    │
│  │  React UI (pages/components)    │    │
│  └──────────┬──────────────────────┘    │
│             │                              │
│  ┌──────────▼──────────────────────┐    │
│  │  API Routes (/app/api/*)        │    │
│  │  - Proxy to Agent Zero REST API │    │
│  │  - Session management           │    │
│  │  - Auth & credentials           │    │
│  └──────────┬──────────────────────┘    │
└─────────────┼─────────────────────────────┘
              │
              ▼
    ┌─────────────────┐
    │  Agent Zero     │
    │  REST API       │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  MCP Tools      │
    │  (Kanban, etc.) │
    └─────────────────┘
```

---

## Consequences

- **Positive:** Fast iteration, single repo, shared patterns with ops-engine.
- **Positive:** Server-side API routes handle credential management cleanly.
- **Negative:** Dashboard tightly coupled to Next.js — harder to swap frontend later if needed (acceptable for internal tooling).
- **Negative:** Long-polling or SSE for real-time session updates requires careful implementation in Next.js.

---

## References

- ops-engine architecture pattern
- Next.js App Router documentation
