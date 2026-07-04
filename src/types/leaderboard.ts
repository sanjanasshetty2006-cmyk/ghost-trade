// ── Leaderboard entry returned by the API ─────────────────────────────────────
export interface LeaderboardEntry {
  rank:           number;
  userId:         string;
  name:           string;         // "Ghost Trader 👻" when ghostMode
  initials:       string;         // for avatar
  college:        string;         // "Anonymous" when ghostMode
  portfolioValue: number;
  returnsPercent: number;
  totalPnl:       number;
  realizedPnl:    number;
  unrealizedPnl:  number;
  cashBalance:    number;
  totalTrades:    number;
  winningTrades:  number;
  winRate:        number;         // 0–100
  xp:             number;
  level:          number;
  ghostMode:      boolean;
  avatarColor:    string;
  isCurrentUser:  boolean;
  createdAt:      string;
}

// ── User profile drawer data ───────────────────────────────────────────────────
export interface LeaderboardUserProfile extends LeaderboardEntry {
  achievements:  string[];
  topHoldings:   Array<{
    symbol:       string;
    companyName:  string;
    currentValue: number;
    pnlPercent:   number;
    pnl:          number;
  }>;
  recentTrades:  Array<{
    _id:          string;
    symbol:       string;
    type:         "BUY" | "SELL";
    quantity:     number;
    price:        number;
    total:        number;
    createdAt:    string;
  }>;
  sectorAllocation: Record<string, number>;
}

// ── Stats cards ───────────────────────────────────────────────────────────────
export interface LeaderboardStats {
  totalPlayers:    number;
  highestPortfolio: number;
  averageReturn:   number;
  highestXp:       number;
  todayTopGainer:  { name: string; returnsPercent: number } | null;
  todayTopLoser:   { name: string; returnsPercent: number } | null;
}

// ── API query params ──────────────────────────────────────────────────────────
export type LeaderboardType = "global" | "weekly" | "monthly" | "alltime" | "college" | "friends";
export type LeaderboardSortBy =
  | "portfolioValue"
  | "returnsPercent"
  | "totalPnl"
  | "xp"
  | "level"
  | "totalTrades"
  | "winRate";

export interface LeaderboardQuery {
  type?:    LeaderboardType;
  sortBy?:  LeaderboardSortBy;
  college?: string;
  search?:  string;
  page?:    number;
  limit?:   number;
}

export interface LeaderboardResponse {
  entries:    LeaderboardEntry[];
  total:      number;
  page:       number;
  totalPages: number;
  myEntry:    LeaderboardEntry | null;
  stats:      LeaderboardStats;
}