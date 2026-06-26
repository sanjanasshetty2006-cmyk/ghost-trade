// ── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  college?: string;
  cashBalance: number;
  xp: number;
  level: number;
  streak: number;
  ghostMode: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ── Portfolio ────────────────────────────────────────────────────────────────
export interface Holding {
  _id: string;
  userId: string;
  symbol: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number;
  exchange: string;
  industry: string;
  sector: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  symbol: string;
  companyName: string;
  type: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP_LOSS";
  quantity: number;
  price: number;
  total: number;
  status: "EXECUTED" | "PENDING" | "CANCELLED";
  createdAt: string;
}

export interface Portfolio {
  holdings: Holding[];
  cashBalance: number;
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  todayPnl: number;
  pnlPercent: number;
  portfolioScore: number;
  diversificationScore: number;
  riskScore: number;
  sectorAllocation: Record<string, number>;
}

// ── Market ───────────────────────────────────────────────────────────────────
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  companyName?: string;
  exchange?: string;
  industry?: string;
  sector?: string;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  marketCap: number;
  shareOutstanding: number;
  logo: string;
  weburl: string;
  description?: string;
  pe?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
}

export interface CandleData {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  s: string;
}

// ── Watchlist ────────────────────────────────────────────────────────────────
export interface WatchlistItem {
  _id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  addedAt: string;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  college?: string;
  returns: number;
  portfolioValue: number;
  trades: number;
  ghostMode: boolean;
  xp: number;
  level: number;
}

// ── AI ───────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

// ── Achievement ───────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

// ── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}