import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lane, Priority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const lanes: Lane[] = ["Now", "Next", "Backlog", "Halted", "Done", "Recurring"];
export const priorities: Priority[] = ["P0", "P1", "P2", "P3"];

export const laneColors: Record<Lane, string> = {
  Now: "border-emerald-600 bg-emerald-950/10",
  Next: "border-cyan-600 bg-cyan-950/10",
  Backlog: "border-slate-600 bg-slate-900/20",
  Halted: "border-amber-600 bg-amber-950/10",
  Done: "border-violet-600 bg-violet-950/10",
  Recurring: "border-rose-600 bg-rose-950/10",
};

export const priorityColors: Record<Priority, string> = {
  P0: "border-rose-500 bg-rose-950/20",
  P1: "border-amber-500 bg-amber-950/20",
  P2: "border-slate-500 bg-slate-900/40",
  P3: "border-slate-700 bg-slate-900/20",
};

export const ownerColors: Record<string, string> = {
  Content: "text-amber-300",
  Build: "text-cyan-300",
  Ops: "text-violet-300",
  Steve: "text-emerald-300",
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}
