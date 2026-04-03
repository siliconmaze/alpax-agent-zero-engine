"use server";

import type {
  AZMessageRequest,
  AZMessageResponse,
  AZProject,
  AZSession,
  AZMetrics,
  AZHealth,
} from "./types";

export class AgentZeroClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl ?? (process.env.AGENT_ZERO_API_URL ?? "http://localhost:50080");
    this.apiKey = apiKey ?? process.env.AGENT_ZERO_API_KEY ?? "";
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
    };
  }

  private async request<T>(path: string, body?: object): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
      // @ts-ignore-next-line
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Agent Zero API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  // ── Core Message ──────────────────────────────────────────
  async sendMessage(req: AZMessageRequest): Promise<AZMessageResponse> {
    return this.request<AZMessageResponse>("/api/message", req);
  }

  // ── Sessions ───────────────────────────────────────────────
  async listSessions(): Promise<AZSession[]> {
    // Agent Zero doesn't have a direct "list sessions" endpoint.
    // We maintain session list in our own DB.
    // This is a stub — real sessions tracked via Kanban cards.
    return [];
  }

  async createSession(projectName?: string, lifetimeHours = 24): Promise<{ context_id: string }> {
    const res = await this.sendMessage({
      message: "ping",
      project_name: projectName,
      lifetime_hours: lifetimeHours,
    });
    return { context_id: res.context_id };
  }

  async getHistory(contextId: string): Promise<{ history: string; size: number; count: number }> {
    return this.request("/api/history_get", { context: contextId });
  }

  async resetChat(contextId: string): Promise<{ ok: boolean }> {
    return this.request("/api/chat_reset", { context: contextId });
  }

  async terminateChat(contextId: string): Promise<{ ok: boolean }> {
    return this.request("/api/terminate_chat", { context: contextId });
  }

  // ── Projects ───────────────────────────────────────────────
  async listProjects(): Promise<AZProject[]> {
    const res = await this.request<{ ok: boolean; data: AZProject[] }>("/api/projects", {
      action: "list",
    });
    return res.data ?? [];
  }

  async createProject(project: Partial<AZProject>): Promise<AZProject> {
    const res = await this.request<{ ok: boolean; data: AZProject }>("/api/projects", {
      action: "create",
      project,
    });
    return res.data;
  }

  async activateProject(contextId: string, projectName: string): Promise<void> {
    await this.request("/api/projects", {
      action: "activate",
      context_id: contextId,
      name: projectName,
    });
  }

  // ── Settings ───────────────────────────────────────────────
  async getSettings(): Promise<Record<string, unknown>> {
    return this.request("/api/settings_get", {});
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.request("/api/settings_set", { key, value });
  }

  // ── Health ─────────────────────────────────────────────────
  async health(): Promise<AZHealth> {
    return this.request<AZHealth>("/api/health");
  }

  // ── Metrics (local tracking) ──────────────────────────────
  async getMetrics(): Promise<AZMetrics> {
    // Token/cost tracking is done locally in the dashboard's SQLite
    return this.request<AZMetrics>("/api/metrics", {});
  }

  // ── Token estimation ────────────────────────────────────────
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // ~4 chars per token for English
  }

  estimateCost(tokens: number, model = "claude"): number {
    const rates: Record<string, { input: number; output: number }> = {
      claude: { input: 15, output: 75 },    // $15/$75 per million
      gpt4: { input: 30, output: 60 },
      gemini: { input: 7, output: 21 },
      minimax: { input: 2, output: 2 },
    };
    const r = rates[model] ?? rates.claude;
    return ((tokens * r.input) / 1_000_000) * 0.001 + ((tokens * r.output) / 1_000_000) * 0.001;
  }
}

// Singleton instance
let _client: AgentZeroClient | null = null;

export function getAgentZeroClient(): AgentZeroClient {
  if (!_client) {
    _client = new AgentZeroClient();
  }
  return _client;
}
