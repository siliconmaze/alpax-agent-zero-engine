"use client";

import { memo } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_LATENCIES = [
  { label: "Claude Sonnet", ms: 1842, color: "bg-amber-500" },
  { label: "GPT-4o", ms: 2341, color: "bg-emerald-500" },
  { label: "MiniMax M2.7", ms: 987, color: "bg-cyan-500" },
  { label: "GLM-5.1", ms: 1654, color: "bg-violet-500" },
];

export const LatencyWidget = memo(function LatencyWidget() {
  const avg = MOCK_LATENCIES.reduce((s, l) => s + l.ms, 0) / MOCK_LATENCIES.length;
  const max = Math.max(...MOCK_LATENCIES.map((l) => l.ms));

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          Latency
        </h3>
        <span className="text-xs font-mono text-slate-500">avg {Math.round(avg)}ms</span>
      </div>

      <div className="space-y-2.5">
        {MOCK_LATENCIES.map((l) => {
          const pct = (l.ms / max) * 100;
          return (
            <div key={l.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-24 shrink-0 truncate">{l.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", l.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-300 w-12 text-right shrink-0">{l.ms}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
