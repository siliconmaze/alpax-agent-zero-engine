"use client";

import { memo } from "react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const MODELS = [
  { name: "MiniMax M2.7", calls: 847, pct: 41, color: "bg-cyan-500" },
  { name: "Claude Sonnet", calls: 512, pct: 25, color: "bg-amber-500" },
  { name: "GPT-4o", calls: 334, pct: 16, color: "bg-emerald-500" },
  { name: "GLM-5.1", calls: 289, pct: 14, color: "bg-violet-500" },
  { name: "Gemini 2.0", calls: 78, pct: 4, color: "bg-rose-500" },
];

export const ModelUsageWidget = memo(function ModelUsageWidget() {
  const total = MODELS.reduce((s, m) => s + m.calls, 0);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          Model Usage
        </h3>
        <span className="text-xs text-slate-500">{total.toLocaleString()} calls</span>
      </div>

      <div className="space-y-2">
        {MODELS.map((m) => (
          <div key={m.name}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-slate-300">{m.name}</span>
              <span className="text-slate-400 font-mono">{m.calls.toLocaleString()} ({m.pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", m.color)} style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Need cn import
