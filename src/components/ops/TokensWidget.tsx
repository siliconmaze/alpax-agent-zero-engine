"use client";

import { memo } from "react";
import { Zap, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokensWidgetProps {
  totalTokens?: number;
  tokensToday?: number;
  estimatedCost?: number;
  activeSessions?: number;
}

export const TokensWidget = memo(function TokensWidget({
  totalTokens = 1247850,
  tokensToday = 89234,
  estimatedCost = 0.12,
  activeSessions = 3,
}: TokensWidgetProps) {
  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  };

  const pct = Math.min((tokensToday / totalTokens) * 100, 100);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          Tokens
        </h3>
        <span className="text-xs text-slate-500">{activeSessions} sessions</span>
      </div>

      {/* Main counter */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-slate-100 font-mono tabular-nums">
          {formatTokens(totalTokens)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">total tokens consumed</p>
      </div>

      {/* Today bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Today</span>
          <span className="text-cyan-400 font-medium font-mono">{formatTokens(tokensToday)}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="h-3 w-3" />
          <span className="font-mono text-emerald-400">${estimatedCost.toFixed(4)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
});
