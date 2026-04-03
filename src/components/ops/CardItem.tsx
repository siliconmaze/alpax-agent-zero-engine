"use client";

import { memo } from "react";
import { GripVertical, ListTodo, Lightbulb, Map, BarChart2, Bell, BookOpen, GraduationCap, Code2, Eye, ClipboardList, FileText, Bot, Cpu } from "lucide-react";
import type { ReactNode } from "react";
import type { Card } from "@/lib/types";
import { cn, priorityColors, ownerColors } from "@/lib/utils";

interface Props {
  card: Card;
  onClick: () => void;
}

const activityIcons: Record<string, ReactNode> = {
  todo:    <ListTodo className="h-4 w-4 text-slate-400" />,
  idea:    <Lightbulb className="h-4 w-4 text-yellow-400" />,
  plan:    <Map className="h-4 w-4 text-cyan-400" />,
  monitor: <BarChart2 className="h-4 w-4 text-blue-400" />,
  alert:   <Bell className="h-4 w-4 text-red-400" />,
  content: <BookOpen className="h-4 w-4 text-amber-400" />,
  course:  <GraduationCap className="h-4 w-4 text-purple-400" />,
  code:    <Code2 className="h-4 w-4 text-emerald-400" />,
  review:  <Eye className="h-4 w-4 text-slate-400" />,
  codetest:<Cpu className="h-4 w-4 text-violet-400" />,
};

export const CardItem = memo(function CardItem({ card, onClick }: Props) {
  const pColor = priorityColors[card.priority] || priorityColors.P2;
  const isError = card.status === "failed" || (card.blockedReason && card.blockedReason.includes("BLOCKED"));
  const isRunning = card.status === "running";
  const isQueued = card.status === "queued";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative mb-2 cursor-pointer rounded-lg border p-2.5 transition-all",
        "hover:brightness-110 active:scale-[0.98]",
        pColor,
        isRunning && "border-cyan-500 bg-cyan-950/20",
        isQueued && "opacity-70",
        isError && "card-glow-error border-rose-500"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="mb-0.5 truncate font-mono text-[10px] text-slate-500">{card.id.slice(0, 8)}</p>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0">
              {activityIcons[card.kind] || <ClipboardList className="h-4 w-4 text-slate-400" />}
            </span>
            <span className="truncate text-sm font-medium">{card.title}</span>
          </div>

          {card.blockedReason && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{card.blockedReason}</p>
          )}

          {card.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{card.description.slice(0, 120)}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={cn("text-xs font-medium", ownerColors[card.owner] || "text-slate-400")}>
              {card.owner}
            </span>
            <span className="text-slate-600">•</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
              {card.priority}
            </span>

            {card.status === "running" && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-xs text-cyan-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                  running
                </span>
              </>
            )}

            {card.agentZeroContextId && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 rounded border border-emerald-700/60 bg-emerald-900/20 px-1.5 py-0.5 text-xs text-emerald-300">
                  <Bot className="h-3 w-3" />
                  {card.agentZeroContextId.slice(0, 8)}
                </span>
              </>
            )}

            {card.modelOverride && (
              <>
                <span className="text-slate-600">•</span>
                <span className="rounded border border-violet-700/60 bg-violet-900/20 px-1.5 py-0.5 text-xs text-violet-300">
                  {card.modelOverride}
                </span>
              </>
            )}

            {card.waitingOn && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-amber-400">waiting: {card.waitingOn}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
