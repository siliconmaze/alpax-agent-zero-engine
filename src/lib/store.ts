"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card, AZSession, AZMetrics, AZSettings } from "./types";

interface AppStore {
  // Cards
  cards: Card[];
  setCards: (cards: Card[]) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;

  // Sessions
  sessions: AZSession[];
  setSessions: (sessions: AZSession[]) => void;

  // Metrics
  metrics: AZMetrics | null;
  setMetrics: (m: AZMetrics | null) => void;

  // Settings
  settings: Partial<AZSettings>;
  updateSettings: (s: Partial<AZSettings>) => void;

  // UI State
  activeView: "kanban" | "sessions" | "memory" | "settings";
  setActiveView: (v: AppStore["activeView"]) => void;
  selectedCard: Card | null;
  setSelectedCard: (c: Card | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  collapsedLanes: Set<string>;
  toggleLaneCollapse: (lane: string) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      cards: [],
      setCards: (cards) => set({ cards }),
      updateCard: (id, patch) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      sessions: [],
      setSessions: (sessions) => set({ sessions }),

      metrics: null,
      setMetrics: (metrics) => set({ metrics }),

      settings: {},
      updateSettings: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),

      activeView: "kanban",
      setActiveView: (activeView) => set({ activeView }),
      selectedCard: null,
      setSelectedCard: (selectedCard) => set({ selectedCard }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      collapsedLanes: new Set(),
      toggleLaneCollapse: (lane) =>
        set((s) => {
          const next = new Set(s.collapsedLanes);
          next.has(lane) ? next.delete(lane) : next.add(lane);
          return { collapsedLanes: next };
        }),
    }),
    {
      name: "alpax-agent-zero-store",
      partialize: (s) => ({ settings: s.settings, collapsedLanes: Array.from(s.collapsedLanes) }),
    }
  )
);
