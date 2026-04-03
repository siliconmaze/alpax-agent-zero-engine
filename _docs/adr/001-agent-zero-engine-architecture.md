# ADR-001: Why Agent Zero Over Other Agent Frameworks?

**Date:** 2026-04-22  
**Status:** Accepted  
**Decider:** Steve Robinson  
**Context:** Selecting the foundational agent framework for alpax-agent-zero-engine

---

## Context

We are building an agent runtime and dashboard that will serve as the backbone for task automation across the Alpax Prime system. We evaluated three primary candidates:

- **Agent Zero** — Full REST API, MCP (Model Context Protocol) support, A2A (Agent-to-Agent) protocol, built-in memory dashboard
- **ZeroClaw** — Lightweight, JSON-RPC only, less mature ecosystem
- **Mastra** — TypeScript-native, but newer and less API-complete

We needed a framework that could be:
1. Exposed as a proper REST API for external clients
2. Connected to MCP tools (Kanban, Slack, Gmail, etc.)
3. Communicate with other agents via A2A
4. Provide a usable dashboard out of the box
5. Allow our existing Next.js frontend to consume it

---

## Decision

**Adopt Agent Zero** as the core agent framework.

---

## Rationale

### Agent Zero

- Full REST API — can be consumed by any frontend or external service
- Native MCP support — critical for connecting to Kanban, Gmail, Telegram, and other Alpax Prime tools
- A2A protocol built-in — enables multi-agent coordination
- Memory dashboard — provides persistent context and conversation history without extra scaffolding
- Active development with a clear production roadmap

### ZeroClaw

- JSON-RPC only — no native HTTP API surface, would require additional proxy layer
- Smaller community and slower release cadence
- Less mature MCP integration

### Mastra

- TypeScript-native — appealing for our stack, but still early-stage
- Fewer built-in integrations out of the box
- Limited MCP tooling compared to Agent Zero
- API surface area is narrower for our observability needs

---

## Consequences

- **Positive:** We get a production-ready REST API, MCP tools, and memory dashboard immediately.
- **Positive:** Agent Zero's architecture aligns with our existing ops-engine pattern (API routes + React frontend).
- **Negative:** We take a dependency on a third-party framework; must monitor its release cadence and stability.
- **Negative:** Agent Zero may require customization for fine-grained session management tied to Kanban cards.

---

## Alternatives Considered

| Framework | REST API | MCP | A2A | Memory | Decision |
|-----------|----------|-----|-----|--------|----------|
| Agent Zero | ✅ Full | ✅ | ✅ | ✅ Built-in | **Selected** |
| ZeroClaw | ❌ JSON-RPC only | ⚠️ Partial | ❌ | ❌ | Rejected |
| Mastra | ⚠️ Early | ⚠️ Partial | ❌ | ❌ | Rejected |

---

## References

- Agent Zero GitHub: https://github.com/fr del/agent-zero
- MCP Specification: https://modelcontextprotocol.io
- A2A Protocol: https://a2a.pro
