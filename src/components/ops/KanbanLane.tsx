"use client";

import { memo } from "react";
import { Minimize2, Maximize2, Plus } from "lucide-react";
import { CardItem } from "./CardItem";
import type { Card, Lane } from "@/lib/types";
import { cn, laneColors } from "@/lib/utils";

interface Props {
  lane: Lane;
  cards: Card[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCardClick: (card: Card) => void;
  onAddCard: (lane: Lane) => void;
}

const laneLabels: Record<Lane, string> = {
  Now: "▶ Now",
  Next: "⏭ Next",
  Backlog: "☐ Backlog",
  Halted: "⏸ Halted",
  Done: "✓ Done",
  Recurring: "🔄 Recurring",
};

export const KanbanLane = memo(function KanbanLane({
  lane,
  cards,
  collapsed,
  onToggleCollapse,
  onCardClick,
  onAddCard,
}: Props) {
  const colorClass = laneColors[lane] || laneColors.Backlog;

  return (
    <div className={cn("flex flex-col rounded-xl border min-h-[200px] shrink-0 w-72", colorClass)}>
      {/* Lane header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="hover:text-cyan-400 transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <h3 className="font-semibold">{laneLabels[lane]}</h3>
          <span className="text-slate-400 text-xs">({cards.length})</span>
          {collapsed && (
            <span className="text-orange-400 text-xs font-medium">Minimized</span>
          )}
        </div>
        <button
          onClick={() => onAddCard(lane)}
          className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 transition-all"
          title="Add card"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Cards */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {cards.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-600 italic">
              No cards
            </p>
          ) : (
            cards.map((card) => (
              <CardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))
          )}
        </div>
      )}
    </div>
  );
});
