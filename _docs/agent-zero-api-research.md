# Agent Zero API — Full Research Document
**Date:** 2026-04-03
**Source:** github.com/agent0ai/agent-zero (cloned)
**Purpose:** alpax-agent-zero-engine — Agent Zero dashboard engine

---

## 1. Overview

Agent Zero is a Python-based AI agent with a **full REST API** built on top of a FastAPI/Flask-style server. It has **no external dependencies** — runs via Docker or directly on Python. It has built-in memory, MCP server support, A2A (Agent-to-Agent) protocol, project management, and sub-agents.

**Key strength for dashboard:** Everything is an API endpoint. Projects, memory, sessions, settings, skills, scheduler — all accessible via HTTP.

---

## 2. Running Agent Zero

### Docker (Recommended)
```bash
cd ~/local-repos/github/ALPAXPRIME/alpax-agent-zero-engine/docker/run
docker-compose up
# Runs on port 50080 (mapped from container port 80)
```

### Direct (Python)
```bash
cd ~/local-repos/github/ALPAXPRIME/alpax-agent-zero-engine
pip install -r requirements.txt
python agent.py
```

### API Server
The API server runs alongside the main agent. All API endpoints are under `/api/`.

**Default port:** `50080` (Docker) or `80` (direct)
**Base URL:** `http://localhost:50080/api/`

---

## 3. Authentication

All API endpoints require an **API key** passed as a header:
```
X-API-Key: your_api_key_here
```

To set/generate API keys: Agent Zero UI → Settings → API Keys

The `requires_api_key` decorator on handlers controls per-endpoint auth.

Some endpoints (health, CSRF) are **public** — no auth required.

---

## 4. Core API Endpoints

### 4.1 Send Message (Core)
**Endpoint:** `POST /api/message`
**Auth:** API Key required
**Description:** Send a message to an Agent Zero session. Creates or continues a conversation.

**Request:**
```json
{
  "message": "Build me a REST API endpoint",
  "context_id": "abc-123",           // optional: continue existing session
  "project_name": "my-project",       // optional: activate project
  "agent_profile": "default",         // optional: override agent profile
  "lifetime_hours": 24,               // optional: session timeout (default 24)
  "attachments": [                    // optional: file attachments
    {
      "filename": "spec.md",
      "base64": "SGVsbG8gV29ybGQ..."
    }
  ]
}
```

**Response:**
```json
{
  "context_id": "abc-123",
  "response": "I've created the REST API endpoint for you..."
}
```

**Key behavior:**
- If `context_id` provided → continues existing session
- If `context_id` omitted → creates new session automatically
- `lifetime_hours` controls auto-cleanup
- Attachments are base64-encoded and saved to disk

---

### 4.2 Create Chat Context
**Endpoint:** `POST /api/chat_create`
**Auth:** API Key required

**Request:**
```json
{
  "current_context": "abc-123",    // optional: copy from existing
  "new_context": "new-uuid"        // optional: specify new context ID
}
```

**Response:**
```json
{
  "ok": true,
  "ctxid": "new-uuid",
  "message": "Context created."
}
```

---

### 4.3 Chat History
**Endpoint:** `POST /api/history_get`
**Auth:** API Key required

**Request:**
```json
{
  "context": "abc-123"
}
```

**Response:**
```json
{
  "history": "Full conversation transcript...",
  "size": 15234,         // token count estimate
  "count": 14            // number of messages
}
```

---

### 4.4 Chat Reset
**Endpoint:** `POST /api/chat_reset`
**Auth:** API Key required

Clears the chat history for a context but keeps the session alive.

---

### 4.5 Terminate Chat
**Endpoint:** `POST /api/terminate_chat`
**Auth:** API Key required

Permanently ends a session. No recovery.

---

## 5. Projects API

### 5.1 List Projects
**Endpoint:** `POST /api/projects`
**Auth:** API Key required

**Request:**
```json
{
  "action": "list"
}
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "name": "my-project",
      "title": "My Project",
      "description": "...",
      "created_at": "2026-04-01T12:00:00Z",
      "last_active": "2026-04-03T08:30:00Z"
    }
  ]
}
```

### 5.2 Create Project
**Endpoint:** `POST /api/projects`
**Auth:** API Key required

**Request:**
```json
{
  "action": "create",
  "project": {
    "name": "my-new-project",
    "title": "My New Project",
    "description": "...",
    "instructions": "You are a senior Python developer..."
  }
}
```

### 5.3 Activate Project (in a session)
**Endpoint:** `POST /api/projects`
**Auth:** API Key required

**Request:**
```json
{
  "action": "activate",
  "context_id": "abc-123",
  "name": "my-project"
}
```

### 5.4 Clone Project from Git
**Endpoint:** `POST /api/projects`
**Auth:** API Key required

**Request:**
```json
{
  "action": "clone",
  "project": {
    "name": "cloned-project",
    "git_url": "https://github.com/user/repo.git",
    "git_token": "ghp_xxxx",
    "title": "Cloned Project"
  }
}
```

### 5.5 Project File Structure
**Endpoint:** `POST /api/projects`
**Auth:** API Key required

**Request:**
```json
{
  "action": "file_structure",
  "name": "my-project",
  "settings": { "max_depth": 3 }
}
```

---

## 6. File Operations API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/get_work_dir_files` | POST | List files in workspace |
| `/api/upload_work_dir_files` | POST | Upload file to workspace |
| `/api/download_work_dir_file` | POST | Download file from workspace |
| `/api/edit_work_dir_file` | POST | Edit file content |
| `/api/delete_work_dir_file` | POST | Delete file |
| `/api/file_info` | POST | Get file metadata |

**File upload example:**
```json
{
  "filename": "spec.md",
  "base64": "SGVsbG8...",
  "path": "/workspace/spec.md"
}
```

---

## 7. Skills API

**Endpoint:** `POST /api/skills`
**Auth:** API Key required

```json
{
  "action": "list"
}
```

Also: `skills_import`, `skills_import_preview` — import skills from URL or file.

---

## 8. MCP Server API

Agent Zero supports MCP (Model Context Protocol) for tool servers.

**List MCP servers:**
```json
{
  "action": "status"
}
```

**Apply MCP server configuration:**
```json
{
  "action": "apply",
  "config": { ... }
}
```

**Get MCP server logs:**
```json
{
  "action": "get_log",
  "server_id": "servers-1"
}
```

---

## 9. Scheduler API

Schedule recurring tasks.

### Create Task
**Endpoint:** `POST /api/scheduler_task_create`
```json
{
  "name": "Daily Report",
  "cron": "0 9 * * *",
  "message": "Generate daily report",
  "context_id": "abc-123",
  "enabled": true
}
```

### List Tasks
**Endpoint:** `POST /api/scheduler_tasks_list`

### Update / Delete / Run
Endpoints: `/api/scheduler_task_update`, `/api/scheduler_task_delete`, `/api/scheduler_task_run`

---

## 10. Settings API

**Get settings:**
```json
POST /api/settings_get
{}
```

**Set setting:**
```json
POST /api/settings_set
{
  "key": "chat_inherit_project",
  "value": true
}
```

---

## 11. Subagents API

Agent Zero supports spawning sub-agents.

**List subagents:**
```json
{
  "action": "list"
}
```

**Load / Save / Delete subagent:**
```json
{
  "action": "save",
  "name": "coder",
  "data": { "instructions": "...", "tools": [...] }
}
```

---

## 12. Health & System

**Health check (no auth):**
```
GET /api/health
POST /api/health
```
```json
{
  "gitinfo": { "branch": "main", "commit": "abc123" },
  "error": null
}
```

**Context window info:**
```json
POST /api/ctx_window_get
{ "context": "abc-123" }
```

---

## 13. Notifications

**Get notification history:**
```json
POST /api/notifications_history
```

**Create notification:**
```json
POST /api/notification_create
{
  "type": "success",
  "message": "Task completed",
  "title": "Agent Zero"
}
```

---

## 14. Message Queue (Async)

For queued/background messages:
- `/api/message_queue_add` — Add to queue
- `/api/message_queue_send` — Send from queue
- `/api/message_queue_remove` — Remove from queue
- `/api/poll` — Poll for results

---

## 15. Backup / Restore

**Create backup:**
```json
POST /api/backup_create
```

**Restore:**
```json
POST /api/backup_restore
{ "backup_id": "..." }
```

**Preview:**
```json
POST /api/backup_restore_preview
{ "backup_id": "..." }
```

---

## 16. WebSocket (Real-time)

Agent Zero has WebSocket endpoints for real-time streaming:
- `/api/ws_webui` — Main WebSocket for UI updates
- `/api/ws_hello` — Connection handshake

This enables real-time streaming responses — important for the dashboard.

---

## 17. Kanban ↔ Agent Zero Mapping

Based on the API analysis, here is how Kanban cards map to Agent Zero:

| Kanban Concept | Agent Zero Concept | API Endpoint |
|----------------|-------------------|--------------|
| Card | `context_id` (chat session) | `POST /api/message` |
| Card title | Project name or first message | `POST /api/projects` |
| Card description | System prompt / context | `POST /api/message` |
| Lane Now | Active running session | `POST /api/message` |
| Lane Done | Archived session | `POST /api/chat_export` |
| Lane Halted | Error state | `POST /api/chat_reset` |
| modelOverride | `agent_profile` | `POST /api/message` |
| Output | Workspace files | `/api/get_work_dir_files` |
| Priority | Lifetime hours / token budget | `lifetime_hours` param |
| Owner | Project owner | `POST /api/projects` |
| blockedReason | Notification error | `POST /api/notifications_history` |

---

## 18. Token & Cost Tracking

Agent Zero returns response text directly. Token tracking needs to be implemented at the dashboard layer:

1. **Local SQLite tracking** — log each `POST /api/message` call with input/output token estimates
2. **Context window API** — `POST /api/ctx_window_get` returns current context size
3. **OpenTelemetry** — if Agent Zero supports it (check `conf/` for config)

**Token estimation formula:**
- Input: ~4 chars per token (English)
- Output: ~4 chars per token
- Use `history_get` → `size` field as approximate

---

## 19. Memory Dashboard

Agent Zero has **built-in adaptive memory** but it's not exposed via API endpoints (yet). 

**Approaches:**
1. **Project-level memory** — each project has persistent context. Use `GET /api/projects` → `file_structure` to explore project knowledge.
2. **Chat history** — `POST /api/history_get` with `context_id` gives full transcript
3. **Future** — request memory API endpoints from Agent Zero team
4. **File-based** — Agent Zero stores memory in `knowledge/` folder per project

---

## 20. Docker Setup for alpax-agent-zero-engine

```yaml
# docker-compose.yml
version: '3.8'
services:
  agent-zero:
    container_name: agent-zero
    image: agent0ai/agent-zero:latest
    volumes:
      - ./agent-zero:/a0
    ports:
      - "50080:80"
    environment:
      - API_KEY=${AGENT_ZERO_API_KEY}
    restart: unless-stopped
```

**Environment variables needed:**
```bash
AGENT_ZERO_API_KEY=your_key_here
# Agent Zero also reads from conf/ directory for additional config
```

---

## 21. MCP Integration

Agent Zero supports MCP servers natively:
1. `POST /api/mcp_servers_apply` — configure MCP server
2. `POST /api/mcp_servers_status` — list running MCP servers

For the dashboard: show MCP server status in Settings panel, allow enabling/disabling servers.

---

## 22. Environment & Model Configuration

Agent Zero supports multiple LLM providers:
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- Groq
- Ollama (local)
- LM Studio (local)
- OpenRouter

Configuration is in `conf/model_providers.yaml`.

For the dashboard: expose model selector per session via `agent_profile` parameter.

---

## 23. Key Findings Summary

| Category | Finding |
|----------|---------|
| **API Completeness** | ⭐⭐⭐⭐⭐ Full REST API, all core features accessible |
| **Auth** | API key via `X-API-Key` header |
| **Sessions** | `context_id` = session ID, create/list/terminate |
| **Projects** | Full CRUD + git clone + file structure |
| **Memory** | Per-project, file-based, not API-exposed yet |
| **Real-time** | WebSocket available (`/api/ws_webui`) |
| **Scheduler** | Cron-based recurring tasks via API |
| **MCP** | Native MCP server support |
| **Docker** | Single image, port 80, volume mount for persistence |
| **Token tracking** | Not in API response — implement locally |
| **A2A Protocol** | Supported (multi-agent) |
| **Dashboard** | Built-in at `/p/docs/` — can reference for UI ideas |

---

## 24. Next Steps for alpax-agent-zero-engine

1. Start Agent Zero Docker container
2. Get API key from Agent Zero UI
3. Build typed API client (`src/lib/agent-zero-client.ts`)
4. Map Kanban cards ↔ Agent Zero contexts
5. Implement token tracking layer (SQLite)
6. Wire up WebSocket for real-time streaming
7. Add MCP server management to Settings panel

---

*Research complete. Agent Zero repo cloned and analyzed.*
*Commits logged: agent-zero cloned, research doc written.*
