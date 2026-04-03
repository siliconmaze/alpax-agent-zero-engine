"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { LayoutDashboard, Bot, MemoryCard, Settings, Command, RefreshCw, ChevronRight, Terminal, Wifi, WifiOff } from "lucide-react";
import { KanbanLane } from "@/components/ops/KanbanLane";
import { AgentSessionsPanel } from "@/components/ops/AgentSessionsPanel";
import { useStore } from "@/lib/store";
import type { Card, Lane } from "@/lib/types";
import { lanes, cn } from "@/lib/utils";

const DEMO_CARDS: Card[] = [
  { id: "demo-1", title: "Connect to Agent Zero API", lane: "Now", owner: "Build", priority: "P0", kind: "code", status: "running", description: "Set up agent-zero-client.ts with API key auth", modelOverride: "minimax/m2.7", agentZeroContextId: "ctx-az-001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "demo-2", title: "Build Sessions Panel", lane: "Now", owner: "Steve", priority: "P0", kind: "plan", status: "idle", description: "Show all Agent Zero sessions with status", blockedReason: "Waiting for API client", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "demo-3", title: "Scaffold Next.js Engine", lane: "Done", owner: "Steve", priority: "P0", kind: "plan", status: "completed", description: "Set up dashboard with ops-engine look-and-feel", modelOverride: "minimax/m2.7", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "demo-4", title: "Observability Widgets", lane: "Backlog", owner: "Build", priority: "P1", kind: "plan", status: "idle", description: "Token counter, cost tracker, latency chart", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "demo-5", title: "Memory Dashboard", lane: "Backlog", owner: "Steve", priority: "P1", kind: "plan", status: "idle", description: "Per-project memory explorer with search", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "demo-6", title: "Command Palette", lane: "Backlog", owner: "Steve", priority: "P1", kind: "code", status: "idle", description: "Cmd+K for quick actions", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useStore();
  const [query, setQuery] = useState("");
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandPaletteOpen(!commandPaletteOpen); }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [commandPaletteOpen, setCommandPaletteOpen]);
  if (!commandPaletteOpen) return null;
  const commands = [
    { cmd: "/new", desc: "Create new Kanban card + Agent Zero session", icon: "+" },
    { cmd: "/session", desc: "Jump to existing session", icon: ">" },
    { cmd: "/search", desc: "Search memory + chat history", icon: "?" },
    { cmd: "/model", desc: "Switch active model", icon: "M" },
    { cmd: "/metrics", desc: "Open observability panel", icon: "#" },
    { cmd: "/settings", desc: "Open settings", icon: "S" },
  ];
  const filtered = query ? commands.filter((c) => c.cmd.includes(query)) : commands;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
          <Command className="h-4 w-4 text-slate-500" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 outline-none text-sm" placeholder="Type a command..." />
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-500">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.map((cmd, i) => (
            <button key={i} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-left" onClick={() => setCommandPaletteOpen(false)}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-xs font-mono text-cyan-400">{cmd.icon}</span>
              <div><p className="text-sm text-slate-200 font-mono">{cmd.cmd}</p><p className="text-xs text-slate-500">{cmd.desc}</p></div>
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>(DEMO_CARDS);
  const [connected, setConnected] = useState(false);
  const { activeView, setActiveView, selectedCard, setSelectedCard, collapsedLanes, toggleLaneCollapse } = useStore();
  useEffect(() => {
    const check = async () => { try { const r = await fetch("/api/agent-zero/health"); setConnected(r.ok); } catch { setConnected(false); } };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);
  const onCard = useCallback((c: Card) => setSelectedCard(c), [setSelectedCard]);
  const onAdd = useCallback((lane: Lane) => {
    const nc: Card = { id: `d-${Date.now()}`, title: "New Card", lane, owner: "Steve", priority: "P2", kind: "todo", status: "idle", description: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setCards((p) => [...p, nc]);
  }, []);
  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 32 32" className="h-8 w-8"><circle cx="16" cy="16" r="12" fill="none" stroke="#22d3ee" strokeWidth="2" /><circle cx="16" cy="16" r="5" fill="#22d3ee" /><line x1="16" y1="4" x2="16" y2="2" stroke="#10b981" strokeWidth="2" strokeLinecap="round" /><line x1="23.2" y1="8.8" x2="24.8" y2="7.2" stroke="#10b981" strokeWidth="2" strokeLinecap="round" /></svg>
          <div><h1 className="font-bold text-slate-100">Alpax Agent Zero</h1><p className="text-xs text-slate-500">Dashboard Engine</p></div>
          <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", connected ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-slate-800 text-slate-400 border border-slate-700")}>
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "Agent Zero Connected" : "Not Connected"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => useStore.getState().setCommandPaletteOpen(true)} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-600"><Command className="h-3.5 w-3.5" /><span>Cmd+K</span></button>
          <button className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-slate-200"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </header>
      <nav className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/50 px-6 py-2">
        {(["kanban", "sessions", "memory", "settings"] as const).map((v) => (
          <button key={v} onClick={() => setActiveView(v)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all", activeView === v ? "bg-slate-800 text-cyan-400 border border-slate-700" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200")}>{v}</button>
        ))}
      </nav>
      <main className="flex-1 overflow-auto">
        {activeView === "kanban" && (
          <div className="flex gap-4 overflow-x-auto p-6 scrollbar-thin">
            {lanes.map((lane) => (
              <KanbanLane key={lane} lane={lane} cards={cards.filter((c) => c.lane === lane)} collapsed={collapsedLanes.has(lane)} onToggleCollapse={() => toggleLaneCollapse(lane)} onCardClick={onCard} onAddCard={onAdd} />
            ))}
          </div>
        )}
        {activeView === "sessions" && (
          <AgentSessionsPanel />
        )}
        {activeView === "memory" && (
          <div className="flex items-center justify-center h-96 text-slate-500"><div className="text-center"><MemoryCard className="h-12 w-12 mx-auto mb-4 opacity-30" /><p className="text-lg font-medium">Memory Dashboard</p><p className="text-sm mt-2">Coming soon</p></div></div>
        )}
        {activeView === "settings" && (
          <div className="max-w-2xl mx-auto p-8 space-y-8">
            <h2 className="text-xl font-bold">Settings</h2>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Agent Zero Connection</h3>
              <div className="space-y-3">
                <div><label className="block text-sm text-slate-300 mb-1">API URL</label><input defaultValue="http://localhost:50080" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-600 focus:outline-none" /></div>
                <div><label className="block text-sm text-slate-300 mb-1">API Key</label><input type="password" placeholder="X-API-Key from Agent Zero UI" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-600 focus:outline-none" /></div>
                <button className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500">Test Connection</button>
              </div>
            </section>
          </div>
        )}
      </main>
      {selectedCard && (
        <div className="fixed inset-y-0 right-0 w-96 border-l border-slate-700 bg-slate-900 z-40 overflow-y-auto shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3">
            <h3 className="font-semibold text-slate-200">Card Details</h3>
            <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-slate-200">✕</button>
          </div>
          <div className="p-4 space-y-4">
            <div><label className="text-xs uppercase tracking-wider text-slate-500">Title</label><p className="mt-1 font-medium">{selectedCard.title}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs uppercase tracking-wider text-slate-500">Lane</label><p className="mt-1">{selectedCard.lane}</p></div>
              <div><label className="text-xs uppercase tracking-wider text-slate-500">Priority</label><p className="mt-1">{selectedCard.priority}</p></div>
            </div>
            {selectedCard.description && <div><label className="text-xs uppercase tracking-wider text-slate-500">Description</label><p className="mt-1 text-sm text-slate-400 whitespace-pre-wrap">{selectedCard.description}</p></div>}
            {selectedCard.agentZeroContextId && <div><label className="text-xs uppercase tracking-wider text-slate-500">Agent Zero Context</label><p className="mt-1 font-mono text-xs text-cyan-400">{selectedCard.agentZeroContextId}</p></div>}
          </div>
        </div>
      )}
      <CommandPalette />
    </div>
  );
}
