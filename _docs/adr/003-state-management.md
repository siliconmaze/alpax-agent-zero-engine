# ADR-003: State Management — React Query + Zustand

**Date:** 2026-04-22  
**Status:** Accepted  
**Decider:** Steve Robinson  
**Context:** Client-side state management strategy for the agent dashboard

---

## Context

The dashboard needs to handle:

- **Server state:** Active sessions, token usage, memory contents, MCP tool status (fetched from Agent Zero API)
- **UI state:** Sidebar open/closed, active tab, modal visibility
- **Preferences:** Selected model, theme, notification settings (persisted locally)

We evaluated:
- Redux Toolkit — heavy, verbose, overkill for this use case
- Zustand — lightweight, minimal boilerplate, good for UI state
- React Query (TanStack Query) — best-in-class for server state, caching, refetching

---

## Decision

**Use React Query for server state and Zustand for local UI state.**

---

## Rationale

### React Query

- **Caching:** Session data, token metrics, and memory snapshots are cached automatically. No manual cache management.
- **Polling/refetching:** Active sessions can be polled every 5–10s without manual interval management.
- **Optimistic updates:** Starting/stopping sessions feels instant.
- **Error handling:** Built-in retry logic and error boundaries.
- **TypeScript-first:** Full type safety across API responses.

### Zustand

- **Minimal boilerplate:** Much less code than Redux for UI state.
- **Persist middleware:** Preferences (model selection, theme) can be persisted to localStorage easily.
- **No provider soup:** Zustand stores are importable anywhere without wrapping components.

### Separation of Concerns

- React Query owns all async/server data
- Zustand owns synchronous client-side state
- No cross-contamination — no store trying to manage API calls

---

## State Taxonomy

| State Type | Tool | Persistence |
|------------|------|-------------|
| Agent sessions list | React Query | None (refetch on focus) |
| Session detail + messages | React Query | None (short cache TTL) |
| Token usage metrics | React Query | None (poll every 30s) |
| MCP tool status | React Query | None (poll every 10s) |
| UI: sidebar, modals, tabs | Zustand | Memory only |
| Preferences: model, theme | Zustand | localStorage via persist middleware |
| Draft session input | Zustand | localStorage |

---

## Consequences

- **Positive:** React Query handles all the hard parts of server state (caching, dedup, error handling).
- **Positive:** Zustand's persist middleware makes preference storage trivial.
- **Positive:** This matches the ops-engine pattern — same mental model for future maintenance.
- **Negative:** Two libraries instead of one — mild additional bundle size (acceptable).

---

## References

- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand-demo.pmnd.rs
