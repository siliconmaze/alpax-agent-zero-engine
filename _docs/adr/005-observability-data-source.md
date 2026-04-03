# ADR-005: Observability Data Source

**Date:** 2026-04-22  
**Status:** Accepted  
**Decider:** Steve Robinson  
**Context:** How to collect and surface observability data (metrics, traces, logs) for agent sessions

---

## Context

We need to observe:
- Token usage per session (input/output tokens, cost)
- Latency per tool call
- Session duration and completion rate
- MCP tool call frequency and error rates
- Model selection distribution

Options evaluated:
- **Agent Zero API response tracking** — parse responses from Agent Zero's own API (no instrumentation needed)
- **OpenTelemetry** — full distributed tracing, but adds infrastructure complexity
- **Local tracking in Next.js** — simple in-process metrics, no external dependency

---

## Decision

**Phase 1: API response tracking via Agent Zero headers and response parsing. Phase 2: Add OpenTelemetry when scale demands it.**

---

## Rationale

### Phase 1 — API Response Tracking (Now)

Agent Zero's REST API already returns usage metadata in response headers and body (token counts, model, latency). We can extract this without any additional instrumentation:

1. **Token usage:** Parse `x-usage-*` headers or response body from `/sessions/:id/messages` endpoints
2. **Session duration:** Track `created_at` → `updated_at` delta
3. **Tool call logs:** Intercept API calls made from the dashboard to Agent Zero; log them locally
4. **Cost estimation:** Multiply token counts by known per-token rates per model

This gives us 80% of observability with 20% of the effort.

### Phase 2 — OpenTelemetry (Later)

When the system grows to multiple instances, cross-service tracing becomes necessary. At that point:
- Instrument Agent Zero with OTLP SDK
- Deploy an OpenTelemetry Collector (Colima + OTEL Collector on Mac Mini)
- Forward traces to a lightweight backend (Jaeger or Grafana Tempo)

This avoids premature infrastructure complexity.

### Local Tracking

For Phase 1, we use a lightweight in-process metrics store:
- In-memory ring buffer for recent events
- Persisted to SQLite or JSONL file for durability
- Exposed via a `/api/metrics` endpoint consumed by React Query

---

## Metrics to Track (Phase 1)

| Metric | Source | Storage |
|--------|--------|---------|
| Input tokens | API response headers | In-memory + JSONL |
| Output tokens | API response headers | In-memory + JSONL |
| Estimated cost | Token × rate table | Computed |
| Session duration | `updated_at - created_at` | In-memory + JSONL |
| Tool call count | Dashboard API interceptor | In-memory |
| Tool call errors | Dashboard API interceptor | In-memory + JSONL |
| Active sessions | Agent Zero `/sessions` list | React Query cache |
| Model usage distribution | Session `model` field | Computed from list |

---

## Consequences

- **Positive:** No new infrastructure for Phase 1. Works immediately.
- **Positive:** In-memory metrics are fast to query from the dashboard.
- **Negative:** Metrics are per-instance. In a distributed setup, Phase 2 OpenTelemetry is required.
- **Negative:** Token usage estimates from headers may differ from actual provider billing (acceptable for internal monitoring).

---

## Future: OpenTelemetry Integration

When ready for Phase 2:

```yaml
# OpenTelemetry Collector config snippet
exporters:
  otlp/tempo:
    endpoint: localhost:4317
  prometheus:
    endpoint: 0.0.0.0:8889

traces:
  receivers: [otlp]
  exporters: [otlp/tempo]
```

---

## References

- Agent Zero API documentation
- OpenTelemetry SDK: https://opentelemetry.io/docs/
- Token pricing tables (OpenRouter / provider docs)
