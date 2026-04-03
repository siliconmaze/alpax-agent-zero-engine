// Kanban card types
export type Lane = "Now" | "Backlog" | "Done" | "Halted" | "Next" | "Recurring";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type CardKind = "todo" | "idea" | "plan" | "code" | "codetest" | "review" | "content" | "monitor" | "alert";
export type CardStatus = "idle" | "queued" | "running" | "completed" | "failed" | "cancelled" | "waiting";
export type Owner = "Steve" | "Build" | "Content" | "Ops";

export interface Card {
  id: string;
  title: string;
  lane: Lane;
  owner: Owner;
  priority: Priority;
  kind: CardKind;
  status: CardStatus;
  description: string;
  blockedReason?: string;
  modelOverride?: string;
  outputPath?: string;
  agentZeroContextId?: string;
  projectName?: string;
  waitingOn?: string;
  parentId?: string;
  childOrder?: number;
  events?: CardEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  runMinutes?: number;
}

export interface CardEvent {
  at: string;
  type: "info" | "state" | "workflow" | "error";
  message: string;
}

// Agent Zero API types
export interface AZMessageRequest {
  message: string;
  context_id?: string;
  project_name?: string;
  agent_profile?: string;
  lifetime_hours?: number;
  attachments?: AZAttachment[];
}

export interface AZAttachment {
  filename: string;
  base64: string;
}

export interface AZMessageResponse {
  context_id: string;
  response: string;
}

export interface AZProject {
  name: string;
  title: string;
  description?: string;
  created_at: string;
  last_active: string;
}

export interface AZSession {
  context_id: string;
  project_name?: string;
  created_at: string;
  last_message_at: string;
  token_count: number;
  status: "active" | "idle" | "expired";
}

export interface AZMetrics {
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
  messages_today: number;
  active_sessions: number;
}

export interface AZMemoryEntry {
  id: string;
  content: string;
  project_name: string;
  created_at: string;
  relevance: number;
}

export interface AZSettings {
  api_url: string;
  api_key: string;
  default_model: string;
  token_budget_per_session: number;
  session_timeout_hours: number;
  enable_memory: boolean;
  enable_mcp: boolean;
  notify_telegram: boolean;
  telegram_webhook?: string;
}

export interface AZHealth {
  gitinfo: { branch: string; commit: string } | null;
  error: string | null;
}

// Dashboard state
export interface DashboardState {
  cards: Card[];
  sessions: AZSession[];
  metrics: AZMetrics | null;
  settings: Partial<AZSettings>;
  activeView: "kanban" | "sessions" | "memory" | "settings";
  selectedCard: Card | null;
  commandPaletteOpen: boolean;
}
