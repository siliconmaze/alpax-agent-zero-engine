# Agent Zero — REST API Architecture Research

**Source:** github.com/agent0ai/agent-zero
**Studied:** 2026-04-02
**Purpose:** Engine-level API documentation for the Alpax Agent Zero Engine

---

## 1. Server Architecture Overview

Agent Zero uses a **hybrid ASGI stack**:

| Component | Technology | Purpose |
|---|---|---|
| HTTP REST | Flask (WSGI) + Uvicorn | API handlers, static files |
| Real-time | Socket.IO (async mode) | WebSocket push events |
| Routing | Starlette | Mounts MCP and A2A proxies |
| Container OS | Kali Linux (rolling) | Full-featured host environment |
| Process manager | Supervisord | SSH, Cron, SearXNG, Agent Zero |

**Startup flow** (`run_ui.py`): `configure_process_environment()` → `UiServerRuntime.create()` (Flask + Socket.IO + WsManager) → `register_http_routes()` + `register_transport_handlers()` (API routes + WS) → `build_asgi_app()` (Starlette mounts /mcp → DynamicMcpProxy, /a2a → DynamicA2AProxy, / → Flask) → `ASGIApp(socketio_server, starlette_app)`.

Default port: **80** (Docker), configurable via `WEB_UI_HOST`/`WEB_UI_PORT`.

---

## 2. API Endpoint Reference

All endpoints registered dynamically from `api/*.py` files. Base path: `POST /api/<module>`. Default method: `POST` (override via `get_methods()`). Auth required by default unless `requires_auth() -> False`.

### 2.1 Core Messaging

#### POST /api/message
Primary synchronous endpoint. Sends a message and **blocks until agent finishes**.

JSON: `{ "text": "Your prompt", "context": "ctxid-abc", "message_id": "uuid" }`
multipart/form-data: `text`, `context`, `message_id`, `attachments` (File[])

Response: `{ "message": "Agent response...", "context": "ctxid-abc" }`
Files saved to `usr/uploads/` with safe filenames. Paths stored as `/a0/usr/uploads/<filename>`.

#### POST /api/message_async
Same payload but returns immediately — does **not** wait.
Response: `{ "message": "Message received.", "context": "ctxid-abc" }`

### 2.2 Message Queue (Batching)

#### POST /api/message_queue_add
Add to per-context queue without triggering execution.
`{ "context": "ctxid", "text": "...", "attachments": [], "item_id": "optional" }`
Response: `{ "ok": true, "item_id": "...", "queue_length": N }`

#### POST /api/message_queue_send
Flush queued messages — single item or all aggregated.
`{ "context": "ctxid", "send_all": false, "item_id": "optional" }`
Response: `{ "ok": true, "sent_item_id": "...", "queue_length": N }`

### 2.3 Chat / Context Management

#### POST /api/chat_create
Create a new `AgentContext`. Optionally inherits project and model override.
`{ "current_context": "existing-ctxid", "new_context": "uuid-or-empty" }`
Response: `{ "ok": true, "ctxid": "new-uuid", "message": "Context created." }`

#### POST /api/chat_reset
Reset agent state (clears memory, cancels scheduler tasks, removes message files).
`{ "context": "ctxid" }`

#### POST /api/chat_load
Load previously saved chat sessions from JSON.
`{ "chats": ["filename1.json", "filename2.json"] }`

#### POST /api/chat_export, /api/chat_remove, /api/terminate_chat
Export, remove, or terminate chat sessions.

### 2.4 Projects API

#### POST /api/projects
Unified project management with action dispatch.

| Action | Description |
|---|---|
| `list` | Return all active projects |
| `list_options` | Return `{key, label}` pairs for UI dropdowns |
| `load` | Load full project metadata (`project.json`) |
| `create` | Create from `BasicProjectData` |
| `clone` | Git-clone a repository as a new project |
| `update` | Update project metadata |
| `delete` | Delete project |
| `activate` | Attach project to a specific context |
| `deactivate` | Detach project from context |
| `file_structure` | Get project file tree with injection settings |

**Data structures:**
```python
BasicProjectData = {
    "title": str, "description": str, "instructions": str,
    "color": str, "git_url": str,
    "file_structure": {
        "enabled": bool, "max_depth": int, "max_files": int,
        "max_folders": int, "max_lines": int, "gitignore": str
    }
}
EditProjectData = BasicProjectData + {
    "name": str, "instruction_files_count": int,
    "knowledge_files_count": int, "variables": str, "secrets": str,
    "subagents": dict[SubAgentSettings]
}
```
Git clone: token via `git_token` field, injected only as `http.extraHeader` — never in URL or git config. Project storage: `usr/projects/<name>/.a0proj/project.json` with `instructions/` and `knowledge/` subdirs.

### 2.5 Agent Management

#### POST /api/agents
`{ "action": "list" }` — Response: `{ "ok": true, "data": [{ "name", "description", "path" }] }`

#### POST /api/subagents
Subagent (child agent) CRUD: `list`, `load`, `save`, `delete`.

### 2.6 MCP Server Endpoints

#### POST /api/mcp_servers_apply
Apply MCP server config. Forces re-init with 1s settle.
```json
{
  "mcp_servers": [
    { "name": "filesystem", "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "type": "stdio" },
    { "name": "github", "url": "https://api.github.com/mcp", "type": "sse" },
    { "name": "remote-api", "url": "https://api.example.com/mcp",
      "type": "streamable-http" }
  ]
}
```
Types: `stdio` (local), `sse`, `streamable-http` (remote). URL-based auto-detection for backward compat.
Response: `{ "success": true, "status": { "<server>": { "status": "...", "tools": [...] } } }`

#### POST /api/mcp_servers_status
Live status of all MCP servers.

#### POST /api/mcp_server_get_detail
`{ "server_name": "filesystem" }` — get detail for one server.

#### POST /api/mcp_server_get_log
Retrieve MCP server log output.

### 2.7 Skills API

#### POST /api/skills
`{ "action": "list", "project_name": "...", "agent_profile": "..." }`
Searches: `skills/`, `plugins/*/skills/`, `usr/projects/<name>/`, per-profile dirs. Uses open **SKILL.md** standard (Claude Code, Cursor, Goose, Codex CLI, Copilot compatible).

#### POST /api/skills_import / skills_import_preview
Import SKILL.md from URL or file upload. Preview before commit.

### 2.8 Plugins API

#### POST /api/plugins
Actions: `get_config`, `save_config`, `get_toggle_status`, `toggle_plugin`, `list_configs`, `delete_config`, `delete_plugin`, `get_default_config`, `get_doc`, `run_execute_script`, `get_execute_record`.

### 2.9 Settings API

#### GET|POST /api/settings_get
Full settings snapshot. API keys and passwords masked as `"****"`.

#### POST /api/settings_set
Update settings. Partial updates supported.

### 2.10 Additional Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET/POST /api/health` | **No** | Health check — git info |
| `POST /api/poll` | Yes | State snapshot (logs, notifications) |
| `POST /api/nudge` | Yes | Interrupt/reset agent |
| `POST /api/pause` | Yes | Pause execution |
| `GET /api/csrf_token` | No | CSRF token + runtime ID |
| `GET /api/logout` | No | Clear session |
| `POST /api/notification_create` | Yes | Create UI notification |
| `POST /api/notifications_*` | Yes | Notification history/clear/mark_read |
| `POST /api/synthesize` | Yes | Kokoro TTS (text to base64 audio) |
| `POST /api/transcribe` | Yes | Whisper STT |
| `POST /api/scheduler_task_*` | Yes | Task scheduler CRUD (create/update/delete/run/list) |
| `POST /api/backup_*` | Yes | Backup: create/restore/inspect/preview_grouped/restore_preview/get_defaults/test |
| `POST /api/upload` | Yes | Upload file to workspace |
| `POST /api/get_work_dir_files` | Yes | List working directory files |
| `POST /api/upload_work_dir_files` | Yes | Upload to workdir |
| `POST /api/download_work_dir_file` | Yes | Download workdir file |
| `POST /api/edit_work_dir_file` | Yes | Edit workdir file |
| `POST /api/delete_work_dir_file` | Yes | Delete workdir file |
| `POST /api/rename_work_dir_file` | Yes | Rename workdir file |
| `POST /api/chat_files_path_get` | Yes | Per-context file storage path |
| `POST /api/file_info` | Yes | File metadata |
| `POST /api/tunnel` | Yes | Tunnel management (Cloudflare etc.) |
| `POST /api/tunnel_proxy` | Yes | Tunnel proxy operations |
| `POST /api/load_webui_extensions` | Yes | Reload WebUI extensions |
| `POST /api/self_update_*` | Yes | Self-update: get/schedule/tags |
| `POST /api/restart` | Yes | Restart agent process |
| `POST /api/rfc` | **No** | RFC-mode read-file-chat (no auth) |
| `POST /api/image_get` | Yes | Serve generated image |
| `POST /api/settings_workdir_file_structure` | Yes | Workdir file tree |
| `POST /api/cache_reset` | Yes | Clear internal cache |
| `POST /api/terminate_chat` | Yes | Terminate a chat context |

---

## 3. Authentication

### 3.1 Session-Based Auth (Dashboard)

Login disabled if `AUTH_LOGIN` not set in `usr/.env`. When enabled, credentials hashed via `SHA256("user:password")` stored in `session["authentication"]`. Flow: `POST /login` validates and sets session cookie; `GET /logout` clears session. Protected routes redirect to `/login` if session missing. CSRF via `csrf_token` cookie + `X-CSRF-Token` header. Dynamic origin allowlist: first non-localhost visit auto-added to `ALLOWED_ORIGINS` in `usr/.env`.

### 3.2 API Key Auth (MCP Tool Server)

MCP server exposes tools to external clients. Auth via header: `X-API-KEY: <token>` or body: `{ "api_key": "<token>" }`. Validated against `settings["mcp_server_token"]`. Token auto-generated on first run via `create_auth_token()`.

### 3.3 CSRF Protection

Enabled by default for authenticated endpoints. Class-level opt-out: `requires_csrf() -> False` on: `health`, `rfc`, `csrf_token`, `logout`. Token via `GET /api/csrf_token` (returns `runtime_id` alongside).

### 3.4 Loopback-Only Endpoints

`requires_loopback()` decorator — only from `127.0.0.1/::1`.

---

## 4. WebSocket vs REST

### 4.1 Socket.IO Architecture

**python-socketio** in async mode is the primary push transport. Namespace: `*` (all namespaces). CORS: `validate_ws_origin()`. Ping: 25s interval, 20s timeout. Max buffer: 50 MB. Debug: `A0_WS_DEBUG=true`. Auto-fallback to HTTP long-polling.

**Built-in handlers** (`api/ws_*.py`): `WsHello` (echo test), `WsWebui` (main UI state sync), `WsDevTest` (dev testing).

State sync: `POST /api/poll` returns snapshot of logs + notifications + context.

### 4.2 When to Use Which

| Use case | Transport |
|---|---|
| Simple prompts | `POST /api/message` (sync REST) |
| Fire-and-forget | `POST /api/message_async` |
| Batch prompts | Queue then `message_queue_send` |
| Real-time UI | Socket.IO + `POST /api/poll` |
| External MCP client | REST to MCP tool server (API key) |
| A2A agent-to-agent | HTTP to `/a2a/` proxy |

---

## 5. Dashboard and Built-In UI

### 5.1 Static WebUI
Served from `webui/` via Flask: `GET /` → index (auth), `GET /login` (public when auth disabled), `GET /logout`, `GET /plugins/<plugin>/<path>` (builtin assets), `GET /usr/plugins/<plugin>/<path>` (user assets), `GET /extensions/webui/<path>` (extensions).

### 5.2 Browser Agent
`_browser_agent` plugin uses Playwright Chromium. Docker ships headless shell pre-installed. Local dev installs on first use into `tmp/playwright/`.

### 5.3 SearXNG
Built-in privacy-respecting search on port 55510 inside container. Agent accesses via `http://localhost:55510`. Config: `/etc/searxng/settings.yml`.

### 5.4 RFC Mode
`POST /api/rfc` — **no auth**. Read-file-chat mode for lightweight agent interaction.

---

## 6. Docker Setup

### 6.1 Images
| Image | Purpose |
|---|---|
| `agent0ai/agent-zero-base:latest` | Base OS layer (Kali Linux + packages) |
| `agent0ai/agent-zero:latest` | Full agent image |
| `agent-zero-local` (local) | Dev image from `DockerfileLocal` |

### 6.2 Minimal Docker Compose
```yaml
services:
  agent-zero:
    image: agent0ai/agent-zero:latest
    container_name: agent-zero
    volumes:
      - ./agent-zero:/a0
    ports:
      - "50080:80"
```

### 6.3 Build from Source
```bash
# Local development
docker build -f DockerfileLocal -t agent-zero-local .

# Git-based branch
docker build -t agent-zero-dev \
  --build-arg BRANCH=development \
  --build-arg CACHE_DATE=$(date +%Y-%m-%d:%H:%M:%S) \
  -f docker/run/Dockerfile .

# Docker Hub (multi-arch)
docker buildx build -t agent0ai/agent-zero:latest \
  --platform linux/amd64,linux/arm64 --push \
  --build-arg BRANCH=main \
  --build-arg CACHE_DATE=$(date +%Y-%m-%d:%H:%M:%S) \
  -f docker/run/Dockerfile .
```

### 6.4 Container Internals
Supervisord manages: SSH (22), Cron, SearXNG (55510), Agent Zero (Uvicorn). Initialization copies `/per/` volume to `/` on startup.

---

## 7. Environment Variables

Loaded from `usr/.env` via `helpers/dotenv.py`.

### 7.1 Automated Settings (A0_SET_ prefix)
Any `Settings` field settable via `A0_SET_<FIELD>` — type auto-detected (bool/dict/str).
```bash
A0_SET_mcp_server_enabled=true
A0_SET_a2a_server_enabled=true
A0_SET_workdir_max_depth=5
A0_SET_agent_profile=hacker
```

### 7.2 Core Variables

| Variable | Purpose | Default |
|---|---|---|
| `WEB_UI_HOST` | Host to bind web server | localhost |
| `WEB_UI_PORT` | Port for web server | 80 |
| `FLASK_SECRET_KEY` | Flask session secret | auto-generated |
| `FLASK_MAX_CONTENT_LENGTH` | Max upload size | 5GB |
| `AUTH_LOGIN` | Dashboard login username | (disabled) |
| `AUTH_PASSWORD` | Dashboard login password | (disabled) |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhosts |
| `A0_WS_DEBUG` | Enable WS debug logging | false |
| `TZ` | Timezone | UTC |

### 7.3 API Keys
Per-model-provider via Settings API or directly in `usr/.env`: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, etc.

### 7.4 MCP Server Token
Auto-generated on first run. Set manually: `A0_SET_mcp_server_token=your-secret-token`.

### 7.5 SearXNG
`SEARXNG_SECRET=<random>`, `SEARXNG_URL=<public-url-if-needed>`.

---

## 8. MCP Server Connection Pattern

### 8.1 Architecture
Agent Zero runs an **MCP client** connecting to external servers, managed by `MCPConfig` (singleton) in `helpers/mcp_handler.py`. It can also act as an **MCP server**, exposing tools to external A2A clients via Starlette-mounted `DynamicMcpProxy`.

### 8.2 MCP Client Connection Types
```python
# Local (stdio)
{ "name": "filesystem", "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
  "type": "stdio" }

# Remote SSE
{ "name": "github", "url": "https://api.github.com/mcp", "type": "sse" }

# Remote Streamable HTTP
{ "name": "my-api", "url": "https://api
Zero runs an **MCP client** connecting to external servers, managed by `MCPConfig` (singleton) in `helpers/mcp_handler.py`. It can also act as an **MCP server**, exposing tools to external A2A clients via Starlette-mounted `DynamicMcpProxy`.

### 8.2 MCP Client Connection Types
```python
# Local (stdio)
{ "name": "filesystem", "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
  "type": "stdio" }

# Remote SSE
{ "name": "github", "url": "https://api.github.com/mcp", "type": "sse" }

# Remote Streamable HTTP
{ "name": "my-api", "url": "https://api.example.com/mcp",
  "type": "streamable-http" }
```

### 8.3 Tool Invocation
MCP tools wrapped as `MCPTool` (extends `Tool`) and registered in agent tool registry. When called: `MCPTool.execute()` calls `MCPConfig.get_instance().call_tool(name, kwargs)`. Result parsed — text content joined, errors captured. Response returned to agent context.

### 8.4 Applying Configuration
`POST /api/mcp_servers_apply` with `{"mcp_servers": [...]}` forces re-init with 1-second settle time.

### 8.5 MCP Tool Server (Agent Zero as Server)
When `mcp_server_enabled=true` and `mcp_server_token` is set, Agent Zero exposes tools via HTTP/SSE at `/mcp/`. External clients authenticate via `X-API-KEY` header.

---

## 9. Projects and Kanban Concept Mapping

### 9.1 Agent Zero Concepts

| A0 Concept | Description |
|---|---|
| **Context** | An isolated agent session (equivalent to a Kanban card) |
| **Context ID** | Unique UUID identifying a running agent instance |
| **Project** | A workspace with instructions, knowledge files, git repo, variables |
| **Subagent** | A child agent definition with its own system prompt |
| **Chat Tab** | UI representation of a Context |

### 9.2 Kanban to Agent Zero Mapping

| Kanban Concept | Agent Zero Equivalent |
|---|---|
| **Card** | `AgentContext` (a running agent instance with unique ctxid) |
| **Lane/Status** | Tracked via context state: running, paused, done |
| **Card Title** | First user message or project title |
| **Card Body** | Full conversation history in context |
| **Parent Card** | Supervisor context that spawns child contexts |
| **Child Cards** | Subordinate agent contexts |
| **Card Priority** | Custom field or message metadata |
| **Card Assignment** | Not native — use agent profile + project assignment |
| **Done Lane** | `POST /api/chat_reset` or `POST /api/terminate_chat` |

### 9.3 Workflow Pattern (Parent-Child)

```
Human -> POST /api/chat_create  (creates parent context)
       -> POST /api/message  (sends task)

Parent Context agent.communicate()
  -> spawns subordinate agent (subagent)
  -> POST /api/chat_create  (creates child context)
  -> POST /api/message_queue_add  (queues sub-task)

Child Context processes sub-task
  -> POST /api/nudge  or  POST /api/message_queue_send

Parent context polls via POST /api/poll  (log_from=N)
  -> reads child logs, aggregates results
  -> responds to Human
```

### 9.4 Persistence
- Chats saved to `usr/chats/` as JSON
- Projects saved to `usr/projects/<name>/.a0proj/`
- Contexts are ephemeral in-memory — persist via chat export/load

---

## 10. Key Files Reference

| File | Purpose |
|---|---|
| `run_ui.py` | Main entry point — initializes and starts web server |
| `helpers/ui_server.py` | UiServerRuntime — Flask + Socket.IO + Starlette assembly |
| `helpers/api.py` | ApiHandler base class, route registration, auth decorators |
| `helpers/ws.py` | WsHandler base, Socket.IO namespace registration |
| `helpers/settings.py` | Settings TypedDict, get/set, convert_in/convert_out |
| `helpers/dotenv.py` | .env file read/write, KEY_AUTH_LOGIN/PASSWORD constants |
| `helpers/login.py` | Session auth: get_credentials_hash, is_login_required |
| `helpers/mcp_handler.py` | MCPConfig singleton, MCPTool wrapper, server type detection |
| `helpers/projects.py` | Project CRUD, git clone, file structure |
| `helpers/backup.py` | BackupService — create/restore/inspect backups |
| `helpers/fasta2a_server.py` | DynamicA2AProxy — A2A protocol server |
| `helpers/mcp_server.py` | DynamicMcpProxy — MCP tool server proxy |
| `agent.py` | AgentContext class, communicate(), nudge() |
| `api/*.py` | All REST API handlers (90+ endpoints) |
| `api/ws_*.py` | WebSocket event handlers |
