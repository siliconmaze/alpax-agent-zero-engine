"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Plus, Send, Trash2, RefreshCw, Clock, Zap, X, Upload } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Card } from "@/lib/types";

interface AZSession {
  context_id: string;
  project_name?: string;
  created_at: string;
  last_message_at: string;
  status: "active" | "idle" | "expired";
  message_count: number;
  token_estimate: number;
}

const DEMO_SESSIONS: AZSession[] = [
  { context_id: "ctx-az-001", project_name: "raytranscribes-refactor", created_at: new Date(Date.now() - 3600000 * 6).toISOString(), last_message_at: new Date(Date.now() - 120000).toISOString(), status: "active", message_count: 247, token_estimate: 420000 },
  { context_id: "ctx-az-002", project_name: "alpax-agent-zero-engine", created_at: new Date(Date.now() - 3600000 * 2).toISOString(), last_message_at: new Date(Date.now() - 300000).toISOString(), status: "active", message_count: 89, token_estimate: 156000 },
  { context_id: "ctx-az-003", project_name: "vault-enterprise-v2", created_at: new Date(Date.now() - 86400000).toISOString(), last_message_at: new Date(Date.now() - 86400000 + 3600000).toISOString(), status: "idle", message_count: 34, token_estimate: 42000 },
  { context_id: "ctx-az-004", project_name: "comic-forge", created_at: new Date(Date.now() - 86400000 * 3).toISOString(), last_message_at: new Date(Date.now() - 86400000 * 2).toISOString(), status: "expired", message_count: 12, token_estimate: 8900 },
];

export function AgentSessionsPanel() {
  const { sessions, setSessions } = useStore();
  const [activeSession, setActiveSession] = useState<AZSession | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProject, setNewProject] = useState("");

  const displaySessions = sessions.length > 0 ? sessions : DEMO_SESSIONS;
  const activeCount = displaySessions.filter((s) => s.status === "active").length;

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !activeSession) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/agent-zero/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context_id: activeSession.context_id, project_name: activeSession.project_name }),
      });
      const data = await res.json();
      setResponse(data.response ?? data.error ?? "No response");
    } catch (e) {
      setResponse(`Error: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [message, activeSession]);

  const createSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent-zero/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Initialize session", project_name: newProject || undefined }),
      });
      const data = await res.json();
      if (data.context_id) {
        const newSess: AZSession = {
          context_id: data.context_id,
          project_name: newProject || undefined,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          status: "active",
          message_count: 0,
          token_estimate: 0,
        };
        // @ts-ignore - local AZSession type vs store AZSession type alignment
        setSessions([...displaySessions, newSess as any]);
        setActiveSession(newSess);
        setShowNewForm(false);
        setNewProject("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [newProject, displaySessions, sessions]);

  const statusColor = (status: AZSession["status"]) => {
    switch (status) {
      case "active": return "text-emerald-400 bg-emerald-950 border border-emerald-800";
      case "idle": return "text-amber-400 bg-amber-950 border border-amber-800";
      case "expired": return "text-slate-500 bg-slate-900 border border-slate-700";
    }
  };

  return (
    <div className="flex h-full gap-0">
      {/* Session list */}
      <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/50">
          <div>
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-400" />
              Sessions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{activeCount} active · {displaySessions.length} total</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-950 border border-emerald-800 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-900 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {showNewForm && (
          <div className="border-b border-slate-800 p-3 bg-slate-900/80 space-y-2">
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="Project name (optional)"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-600 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && createSession()}
            />
            <div className="flex gap-2">
              <button onClick={createSession} disabled={loading} className="flex-1 rounded-lg bg-cyan-700 px-3 py-1.5 text-xs text-white hover:bg-cyan-600 disabled:opacity-50">
                {loading ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setShowNewForm(false)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {displaySessions.map((sess) => (
            <button
              key={sess.context_id}
              onClick={() => setActiveSession(sess)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-all",
                activeSession?.context_id === sess.context_id && "bg-slate-800 border-l-2 border-l-cyan-500"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-cyan-400">{sess.context_id.slice(0, 12)}...</span>
                <span className={cn("text-[10px] rounded px-1.5 py-0.5 font-medium", statusColor(sess.status))}>
                  {sess.status}
                </span>
              </div>
              <p className="text-sm text-slate-200 truncate">{sess.project_name ?? "General"}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(sess.last_message_at)}</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{(sess.token_estimate / 1000).toFixed(0)}k tok</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a session</p>
              <p className="text-sm mt-1">Or create a new one to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Session header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-900/30">
              <div>
                <p className="font-mono text-xs text-cyan-400">{activeSession.context_id}</p>
                <p className="text-sm text-slate-300">{activeSession.project_name ?? "General Session"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs rounded px-2 py-0.5 font-medium", statusColor(activeSession.status))}>{activeSession.status}</span>
                <button className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-rose-400 hover:border-rose-700 transition-all" title="Delete session">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-cyan-400 hover:border-cyan-700 transition-all" title="Refresh">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 border-b border-slate-800/50 px-4 py-2 bg-slate-900/20 text-xs text-slate-500">
              <span>Messages: <span className="text-slate-300">{activeSession.message_count}</span></span>
              <span>Tokens: <span className="text-slate-300">{(activeSession.token_estimate / 1000).toFixed(0)}k</span></span>
              <span>Created: <span className="text-slate-300">{timeAgo(activeSession.created_at)}</span></span>
            </div>

            {/* Response */}
            {(response || loading) && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Agent Zero</span>
                    {loading && <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {loading ? "Thinking..." : response}
                  </p>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/50">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={`Send a message to ${activeSession.context_id.slice(0, 12)}...`}
                  rows={2}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-600 focus:outline-none resize-none"
                />
                <div className="flex flex-col gap-1.5">
                  <button className="rounded-lg border border-slate-700 p-2 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all" title="Attach file">
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || loading}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50 transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">Press Enter to send · Shift+Enter for newline</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
