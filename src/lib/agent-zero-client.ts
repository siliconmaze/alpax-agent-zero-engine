/**
 * Agent Zero - Typed API Client
 *
 * A reusable, typed HTTP client for the Agent Zero REST API.
 * Used by all dashboard components to communicate with the Agent Zero engine.
 *
 * Features:
 * - Auto-retry with exponential backoff
 * - Request/response logging
 * - Token counting from response headers
 * - Error mapping (API errors to user-friendly messages)
 * - Full TypeScript types for all payloads
 * - Mock mode for development (no server required)
 *
 * Reference: _docs/agent-zero-api-research.md
 */

import { AZAttachment, AZMessageResponse, AZProject, AZMemoryEntry, AZHealth } from './types';

export type { AZAttachment, AZMessageResponse, AZProject, AZMemoryEntry, AZHealth };

// ─── Additional Typed Payloads ───────────────────────────────────────────────

/** Token usage extracted from response headers */
export interface AgentZeroTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
}

/** Full API response wrapper */
export interface AgentZeroResponse {
  message: string;
  contextId: string;
  tokens?: AgentZeroTokenUsage;
  timestamp: string;
  raw: unknown;
}

/** A conversation context / session */
export interface AgentZeroContext {
  contextId: string;
  projectName?: string;
  agentProfile?: string;
  lifetimeHours?: number;
  createdAt: string;
  lastActiveAt: string;
  messageCount: number;
  tokenCount: number;
  status: "active" | "idle" | "expired";
}

/** Project-level memory summary */
export interface AgentZeroMemoryStats {
  projectName: string;
  totalEntries: number;
  totalTokens: number;
  oldestEntry: string;
  newestEntry: string;
  memoryFiles: string[];
}

/** Aggregated metrics snapshot */
export interface AgentZeroMetricsSummary {
  messagesToday: number;
  activeSessions: number;
  totalTokensToday: number;
  avgLatencyMs: number;
  uptime: string;
  gitBranch: string;
  gitCommit: string;
}

/** Client configuration */
export interface AgentZeroClientConfig {
  baseUrl?: string;
  apiKey?: string;
  maxRetries?: number;
  baseDelayMs?: number;
  enableLogging?: boolean;
  mockMode?: boolean;
  logger?: (entry: LogEntry) => void;
}

/** A single log entry */
export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
  attempt?: number;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export enum AgentZeroErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  AUTH_FAILED = "AUTH_FAILED",
  CONTEXT_NOT_FOUND = "CONTEXT_NOT_FOUND",
  PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN = "UNKNOWN",
}

export class AgentZeroError extends Error {
  constructor(
    public readonly code: AgentZeroErrorCode,
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AgentZeroError";
  }
  toString(): string {
    const http = this.statusCode ? " (HTTP " + this.statusCode + ")" : "";
    return "[" + this.code + "] " + this.message + http;
  }
}

const ERROR_MAP: Record<number, { code: AgentZeroErrorCode; message: string }> = {
  400: { code: AgentZeroErrorCode.VALIDATION_ERROR, message: "Invalid request." },
  401: { code: AgentZeroErrorCode.AUTH_FAILED, message: "Authentication failed." },
  403: { code: AgentZeroErrorCode.AUTH_FAILED, message: "Access denied." },
  404: { code: AgentZeroErrorCode.CONTEXT_NOT_FOUND, message: "Resource not found." },
  408: { code: AgentZeroErrorCode.TIMEOUT, message: "Request timed out." },
  429: { code: AgentZeroErrorCode.RATE_LIMITED, message: "Rate limited." },
  500: { code: AgentZeroErrorCode.SERVER_ERROR, message: "Agent Zero server error." },
  502: { code: AgentZeroErrorCode.SERVER_ERROR, message: "Bad gateway." },
  503: { code: AgentZeroErrorCode.SERVER_ERROR, message: "Agent Zero server unavailable." },
};

function mapHttpError(status: number, body?: unknown): AgentZeroError {
  const mapped = ERROR_MAP[status] ?? { code: AgentZeroErrorCode.UNKNOWN, message: "An unexpected error occurred." };
  const detail = typeof body === "object" && body !== null && "message" in body ? String((body as Record<string, unknown>).message) : undefined;
  return new AgentZeroError(mapped.code, detail ?? mapped.message, status, body);
}

// ─── Token Header Parsing ─────────────────────────────────────────────────────
// Supported: X-Token-Usage JSON, Openai-Usage query-string, X-Token-Cost

function parseTokenUsage(headers: Headers): AgentZeroTokenUsage {
  const out: AgentZeroTokenUsage = {};
  const xtu = headers.get("x-token-usage") ?? headers.get("X-Token-Usage");
  if (xtu) {
    try {
      const p = JSON.parse(xtu);
      out.promptTokens = Number(p.prompt ?? p.prompt_tokens ?? 0);
      out.completionTokens = Number(p.completion ?? p.completion_tokens ?? 0);
      out.totalTokens = Number(p.total ?? p.total_tokens ?? 0);
    } catch { /* ignore */ }
  }
  const oai = headers.get("openai-usage") ?? headers.get("Openai-Usage");
  if (oai) {
    const params = new URLSearchParams(oai);
    out.promptTokens ??= Number(params.get("prompt_tokens") ?? 0);
    out.completionTokens ??= Number(params.get("completion_tokens") ?? 0);
    out.totalTokens ??= Number(params.get("total_tokens") ?? 0);
  }
  const cost = headers.get("x-token-cost") ?? headers.get("X-Token-Cost");
  if (cost) out.costUsd = parseFloat(cost);
  return out;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

function mockDelay(ms = 200): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

const _mockSessions = new Map<string, AgentZeroContext>([
  ["mock-ctx-001", {
    contextId: "mock-ctx-001",
    projectName: "test-project",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    lastActiveAt: new Date().toISOString(),
    messageCount: 12,
    tokenCount: 4800,
    status: "active",
  }],
]);

const _mockProjects: AZProject[] = [
  { name: "test-project", title: "Test Project", description: "A demo project", created_at: new Date(Date.now() - 86400000).toISOString(), last_active: new Date().toISOString() },
  { name: "docs-bot", title: "Docs Bot", created_at: new Date(Date.now() - 172800000).toISOString(), last_active: new Date().toISOString() },
];

const _mockMetrics: AgentZeroMetricsSummary = {
  messagesToday: 47,
  activeSessions: 3,
  totalTokensToday: 124800,
  avgLatencyMs: 1240,
  uptime: "4d 7h 22m",
  gitBranch: "main",
  gitCommit: "a1b2c3d",
};

const _mockMemory: AZMemoryEntry[] = [
  { id: "mem-001", content: "User prefers markdown format.", project_name: "test-project", created_at: new Date(Date.now() - 3600000).toISOString(), relevance: 0.95 },
  { id: "mem-002", content: "K8S project uses Helm for deployments.", project_name: "test-project", created_at: new Date(Date.now() - 7200000).toISOString(), relevance: 0.87 },
  { id: "mem-003", content: "Claude is preferred for code review.", project_name: "docs-bot", created_at: new Date(Date.now() - 86400000).toISOString(), relevance: 0.72 },
];

// ─── Agent Zero Client ───────────────────────────────────────────────────────

/**
 * Typed API client for Agent Zero.
 *
 * Usage:
 *   const client = new AgentZeroClient({ baseUrl: "http://localhost:80" });
 *   const resp = await client.sendMessage("Hello, agent.");
 *
 * Environment variables:
 *   AGENT_ZERO_URL     - base URL (default: http://localhost:80)
 *   AGENT_ZERO_API_KEY - API key for auth
 *   AGENT_ZERO_MOCK    - "true" to force mock mode
 *   NODE_ENV=development - auto-enables mock mode
 */
export class AgentZeroClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly enableLogging: boolean;
  private readonly logger?: (entry: LogEntry) => void;
  readonly mockMode: boolean;

  static readonly isMockDefault =
    process.env["NODE_ENV"] === "development" || process.env["AGENT_ZERO_MOCK"] === "true";

  constructor(config: AgentZeroClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env["AGENT_ZERO_URL"] ?? "http://localhost:80").replace(/\/$/, "");
    this.apiKey = config.apiKey ?? process.env["AGENT_ZERO_API_KEY"] ?? "";
    this.maxRetries = config.maxRetries ?? 3;
    this.baseDelayMs = config.baseDelayMs ?? 500;
    this.enableLogging = config.enableLogging ?? true;
    this.logger = config.logger;
    this.mockMode = config.mockMode ?? AgentZeroClient.isMockDefault;
  }

  // ─── Internal HTTP helpers ──────────────────────────────────────────────

  private async _request<T>(method: string, path: string, body?: unknown, attempt = 1): Promise<{ data: T; headers: Headers; durationMs: number }> {
    const url = this.baseUrl + path;
    const start = Date.now();
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      const durationMs = Date.now() - start;
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      const msg = isTimeout ? "Request timed out." : "Network error: " + String(err);
      this._log({ timestamp: new Date().toISOString(), method, url, durationMs, error: msg, attempt });
      throw new AgentZeroError(isTimeout ? AgentZeroErrorCode.TIMEOUT : AgentZeroErrorCode.NETWORK_ERROR, msg, undefined, err);
    }

    const durationMs = Date.now() - start;
    let data: unknown;
    try {
      data = response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch { data = undefined; }

    this._log({ timestamp: new Date().toISOString(), method, url, status: response.status, durationMs, requestBody: body, responseBody: data, attempt });
    if (!response.ok) throw mapHttpError(response.status, data);
    return { data: data as T, headers: response.headers, durationMs };
  }

  private async _requestWithRetry<T>(method: string, path: string, body?: unknown, attempt = 1): Promise<{ data: T; headers: Headers; durationMs: number }> {
    try {
      return await this._request<T>(method, path, body, attempt);
    } catch (err) {
      if (attempt >= this.maxRetries) throw err;
      const retryable = err instanceof AgentZeroError &&
        [AgentZeroErrorCode.NETWORK_ERROR, AgentZeroErrorCode.TIMEOUT, AgentZeroErrorCode.SERVER_ERROR, AgentZeroErrorCode.RATE_LIMITED].includes(err.code);
      if (!retryable) throw err;
      // Exponential backoff with jitter
      const delay = this.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, delay));
      return this._requestWithRetry<T>(method, path, body, attempt + 1);
    }
  }

  private _log(entry: LogEntry): void {
    if (!this.enableLogging) return;
    if (this.logger) { this.logger(entry); return; }
    const parts = ["[AgentZeroClient]"];
    parts.push(entry.error ? "ERROR" : entry.status ? String(entry.status) : "-->");
    parts.push(entry.method, entry.url);
    if (entry.durationMs) parts.push("(" + entry.durationMs + "ms)");
    if (entry.attempt && entry.attempt > 1) parts.push("[retry " + entry.attempt + "]");
    if (entry.error) parts.push("-", entry.error);
    console.debug(parts.join(" "));
  }

  // ─── sendMessage ─────────────────────────────────────────────────────────

  /**
   * Send a message and wait for the agent to finish processing.
   * @param message     User message text
   * @param contextId   Reuse an existing context/session ID
   * @param projectName Activate a project by name
   * @param attachments Files to attach (base64 encoded)
   */
  async sendMessage(message: string, contextId?: string, projectName?: string, attachments?: AZAttachment[]): Promise<AgentZeroResponse> {
    if (this.mockMode) {
      await mockDelay();
      return {
        message: "[MOCK] Agent received: " + message.slice(0, 80),
        contextId: contextId ?? "mock-ctx-new",
        tokens: { promptTokens: 42, completionTokens: 38, totalTokens: 80, costUsd: 0.0008 },
        timestamp: new Date().toISOString(),
        raw: { ok: true },
      };
    }
    const reqBody: Record<string, unknown> = { text: message };
    if (contextId) reqBody.context = contextId;
    if (projectName) reqBody.project_name = projectName;
    if (attachments?.length) reqBody.attachments = attachments;
    const { data, headers } = await this._requestWithRetry<AZMessageResponse>("POST", "/api/message", reqBody);
    const d = data as any;
    return {
      message: d.response ?? d.message ?? "",
      contextId: d.context_id ?? contextId ?? "",
      tokens: parseTokenUsage(headers),
      timestamp: new Date().toISOString(),
      raw: data,
    };
  }

  // ─── Sessions ──────────────────────────────────────────────────────────

  /**
   * Create a new conversation context / session.
   * POST /api/chat_create
   */
  async createSession(projectName?: string, lifetimeHours?: number): Promise<AgentZeroContext> {
    if (this.mockMode) {
      await mockDelay();
      const ctx: AgentZeroContext = {
        contextId: "mock-ctx-" + Date.now(),
        projectName,
        lifetimeHours,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        messageCount: 0,
        tokenCount: 0,
        status: "active",
      };
      _mockSessions.set(ctx.contextId, ctx);
      return ctx;
    }
    const newId = "ctx-" + crypto.randomUUID();
    const reqBody: Record<string, unknown> = { new_context: newId };
    if (projectName) reqBody.project_name = projectName;
    const { data } = await this._requestWithRetry<{ ok: boolean; ctxid: string }>("POST", "/api/chat_create", reqBody);
    const d = data as any;
    return {
      contextId: d.ctxid ?? newId,
      projectName,
      lifetimeHours,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      messageCount: 0,
      tokenCount: 0,
      status: "active",
    };
  }

  /**
   * List all active sessions / contexts.
   * POST /api/chat_list
   */
  async listSessions(): Promise<AgentZeroContext[]> {
    if (this.mockMode) { await mockDelay(); return Array.from(_mockSessions.values()); }
    const { data } = await this._requestWithRetry<{ sessions?: any[]; data?: any[] }>("POST", "/api/chat_list", {});
    const d = data as any;
    const raw: any[] = d.sessions ?? d.data ?? [];
    return raw.map((s) => ({
      contextId: s.context_id ?? s.ctxid ?? s.id ?? "",
      projectName: s.project_name,
      createdAt: s.created_at ?? "",
      lastActiveAt: s.last_message_at ?? "",
      messageCount: s.message_count ?? 0,
      tokenCount: s.token_count ?? 0,
      status: s.status ?? "active",
    }));
  }

  /**
   * Get a single session by context ID.
   * POST /api/chat_load or GET from /api/chat_list and filter.
   */
  async getSession(contextId: string): Promise<AgentZeroContext | null> {
    if (this.mockMode) { await mockDelay(); return _mockSessions.get(contextId) ?? null; }
    const sessions = await this.listSessions();
    return sessions.find((s) => s.contextId === contextId) ?? null;
  }

  /**
   * Delete / terminate a session by context ID.
   * POST /api/terminate_chat or POST /api/chat_remove
   */
  async deleteSession(contextId: string): Promise<void> {
    if (this.mockMode) { await mockDelay(); _mockSessions.delete(contextId); return; }
    await this._requestWithRetry("POST", "/api/terminate_chat", { context: contextId });
  }

  // ─── Memory ───────────────────────────────────────────────────────────

  /**
   * Search memory across all projects or a specific one.
   * POST /api/memory_search
   */
  async searchMemory(query: string, projectName?: string): Promise<AZMemoryEntry[]> {
    if (this.mockMode) {
      await mockDelay();
      const q = query.toLowerCase();
      return _mockMemory.filter((m) =>
        (!projectName || m.project_name === projectName) &&
        (m.content.toLowerCase().includes(q) || m.project_name.toLowerCase().includes(q))
      );
    }
    const reqBody: Record<string, unknown> = { query };
    if (projectName) reqBody.project_name = projectName;
    const { data } = await this._requestWithRetry<{ results?: AZMemoryEntry[]; entries?: AZMemoryEntry[]; data?: AZMemoryEntry[] }>(
      "POST", "/api/memory_search", reqBody
    );
    const d = data as any;
    return d.results ?? d.entries ?? d.data ?? [];
  }

  /**
   * Get memory statistics for a project.
   * POST /api/memory_stats
   */
  async getMemoryStats(projectName: string): Promise<AgentZeroMemoryStats> {
    if (this.mockMode) {
      await mockDelay();
      const entries = _mockMemory.filter((m) => m.project_name === projectName);
      return {
        projectName,
        totalEntries: entries.length,
        totalTokens: entries.length * 150,
        oldestEntry: entries[entries.length - 1]?.created_at ?? "",
        newestEntry: entries[0]?.created_at ?? "",
        memoryFiles: [],
      };
    }
    const { data } = await this._requestWithRetry<any>("POST", "/api/memory_stats", { project_name: projectName });
    const d = data as any;
    return {
      projectName: d.project_name ?? projectName,
      totalEntries: d.total_entries ?? d.totalEntries ?? 0,
      totalTokens: d.total_tokens ?? d.totalTokens ?? 0,
      oldestEntry: d.oldest_entry ?? d.oldestEntry ?? "",
      newestEntry: d.newest_entry ?? d.newestEntry ?? "",
      memoryFiles: d.memory_files ?? d.memoryFiles ?? [],
    };
  }

  // ─── Metrics ──────────────────────────────────────────────────────────

  /**
   * Get aggregated metrics from /api/poll.
   */
  async getMetrics(): Promise<AgentZeroMetricsSummary> {
    if (this.mockMode) { await mockDelay(); return _mockMetrics; }
    const { data } = await this._requestWithRetry<any>("POST", "/api/poll", {});
    const d = data as any;
    return {
      messagesToday: d.messages_today ?? d.messagesToday ?? 0,
      activeSessions: d.active_sessions ?? d.activeSessions ?? 0,
      totalTokensToday: d.total_tokens_today ?? d.totalTokensToday ?? 0,
      avgLatencyMs: d.avg_latency_ms ?? d.avgLatencyMs ?? 0,
      uptime: d.uptime ?? "",
      gitBranch: d.git_branch ?? d.gitBranch ?? "",
      gitCommit: d.git_commit ?? d.gitCommit ?? "",
    };
  }

  // ─── Utility ─────────────────────────────────────────────────────────

  /**
   * Ping /api/health to verify the server is reachable.
   * Returns health info or throws.
   */
  async testConnection(): Promise<AZHealth> {
    if (this.mockMode) {
      await mockDelay(50);
      return { gitinfo: { branch: "main", commit: "a1b2c3d" }, error: null };
    }
    const { data } = await this._requestWithRetry<AZHealth>("GET", "/api/health", undefined);
    return data;
  }

  /**
   * Shorthand: send a message and get back just the text.
   */
  async ask(message: string, contextId?: string, projectName?: string): Promise<string> {
    const resp = await this.sendMessage(message, contextId, projectName);
    return resp.message;
  }
}
