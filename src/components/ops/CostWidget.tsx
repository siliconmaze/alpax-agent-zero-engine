"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";

const MOCK_COSTS = [
  { model: "Claude Sonnet", cost: 8.42, pct: 38 },
  { model: "GPT-4o", cost: 6.18, pct: 28 },
  { model: "MiniMax M2.7", cost: 4.21, pct: 19 },
  { model: "GLM-5.1", cost: 3.10, pct: 14 },
  { model: "Other", cost: 0.12, pct: 1 },
];

export const CostWidget = memo(function CostWidget() {
  const total = MOCK_COSTS.reduce((s, c) => s + c.cost, 0);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Cost
        </h3>
        <span className="text-lg font-bold font-mono text-emerald-400">${total.toFixed(2)}</span>
      </div>

      <div className="space-y-1.5">
        {MOCK_COSTS.map((c) => (
          <div key={c.model} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="text-slate-400">{c.model}</span>
            </div>
            <span className="font-mono text-slate-300">${c.cost.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
