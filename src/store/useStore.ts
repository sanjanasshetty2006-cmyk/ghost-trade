"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, ChatMessage } from "@/types";

// ── Auth Store ────────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "gt-auth" }
  )
);

// ── UI Store ──────────────────────────────────────────────────────────────────
interface UIStore {
  currentPage: string;
  splashDone: boolean;
  theme: "dark" | "light";
  tradeSymbol: string;
  tradeCompany: string;
  tradePrice: number;
  setPage: (page: string) => void;
  setSplashDone: () => void;
  setTheme: (t: "dark" | "light") => void;
  setTradeStock: (symbol: string, company: string, price: number) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      currentPage: "home",
      splashDone: false,
      theme: "dark",
      tradeSymbol: "RELIANCE",
      tradeCompany: "Reliance Industries",
      tradePrice: 2847.3,
      setPage: (page) => set({ currentPage: page }),
      setSplashDone: () => set({ splashDone: true }),
      setTheme: (theme) => set({ theme }),
      setTradeStock: (tradeSymbol, tradeCompany, tradePrice) =>
        set({ tradeSymbol, tradeCompany, tradePrice }),
    }),
    { name: "gt-ui" }
  )
);

// ── AI Chat Store ─────────────────────────────────────────────────────────────
interface AIStore {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (msg: ChatMessage) => void;
  setTyping: (v: boolean) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIStore>()((set) => ({
  messages: [
    {
      role: "ai",
      content:
        "Hey! I'm Ghost AI 👻 — your AI trading coach. I've analyzed your portfolio. Ask me anything about stocks, your holdings, risk, or market strategy!",
      timestamp: new Date(),
    },
  ],
  isTyping: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () =>
    set({
      messages: [
        {
          role: "ai",
          content: "Hey! I'm Ghost AI 👻 — your AI trading coach. Ask me anything!",
          timestamp: new Date(),
        },
      ],
    }),
}));
