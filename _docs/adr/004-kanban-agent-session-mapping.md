# ADR-004: Kanban ↔ Agent Zero Session Mapping

**Date:** 2026-04-22  
**Status:** Accepted  
**Decider:** Steve Robinson  
**Context:** How Kanban cards map to Agent Zero agent sessions

---

## Context

Kanban (ops-engine) is the task coordination layer. Agent Zero runs the actual agent execution. We need a clear, bidirectional mapping between them:

- One card = one agent session
- Lane/status drives session lifecycle
- LLM selection is per-card

---

## Decision

**Map Kanban cards to Agent Zero sessions 1:1** with lane-driven lifecycle management.

---

## Mapping Table

| Kanban Concept | Agent Zero Concept | Notes |
|----------------|--------------------|-------|
| Card | Agent Session | One card = one session ID |
| Lane | Session Status | Backlog → Running → Done |
| Card Priority | Session Priority | Queuing order |
| modelOverride | LLM Model | Per-card model selection |
| Card owner | Session owner | Maps to `createdBy` / agent identity |
| Card description | System prompt | Initial context for session |

---

## Lifecycle Flow

```
Kanban Card Created
       │
       ▼
  Backlog Lane  ──── Card started ────▶  Running Lane
                                           │
                                    Agent Zero session
                                    created and executing
                                           │
                     Card completed ◀──────┴──────▶ Running Lane
                            │
                            ▼
                       Done Lane
                   (session archived)
```

### Lane → Status Mapping

| Lane | Card Status | Agent Zero Action |
|------|-------------|-------------------|
| Backlog | `pending` | Session not started |
| In Progress / Running | `running` | Session created, actively executing |
| Done | `completed` | Session archived, resources cleaned up |
| Blocked | `waiting` | Session paused, context preserved |
| Archive | `archived` | Session deleted or cold-stored |

### modelOverride → LLM

The `modelOverride` field on a Kanban card maps directly to the LLM model used when creating the Agent Zero session:

- `minimax/m2.5` → MiniMax M2.5 (default)
- `deepseek/deepseek-r1` → DeepSeek R1 (reasoning tasks)
- `ollama/llama3.1` → Local Ollama (privacy-sensitive)
- `openai/gpt-4o` → OpenAI GPT-4o (complex tasks)

---

## Implementation Notes

1. **Session ID stored on card:** When a session starts, the Agent Zero `session_id` is written back to the card (custom field or tag).
2. **Lane change triggers action:** Moving a card to "In Progress" → creates/resumes session. Moving to "Done" → terminates session.
3. **Resumability:** Agent Zero supports context-preserved resume; a card moved back to "In Progress" reuses the existing session.
4. **Multi-agent cards:** A parent card can spawn multiple child sessions (one per child card), coordinating via A2A.

---

## Consequences

- **Positive:** Single source of truth (Kanban) for task state; Agent Zero is the execution engine.
- **Positive:** Existing Kanban workflows (Ops|Build|Content lanes, owner assignment) extend naturally to agent tasks.
- **Positive:** modelOverride per card enables heterogeneous multi-model agent orchestration.
- **Negative:** Bidirectional sync must be implemented carefully — card status changes must not race with Agent Zero status updates.

---

## References

- Agent Zero session API
- Kanban card API (`/cards/:id`)
