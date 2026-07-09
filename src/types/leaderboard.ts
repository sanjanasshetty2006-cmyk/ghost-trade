export interface LeaderboardEntry {
  rank:           number;
  userId:         string;
  name:           string;
  initials:       string;
  college:        string;
  portfolioValue: number;
  returnsPercent: number;
  totalPnl:       number;
  cashBalance:    number;
  totalTrades:    number;
  winningTrades:  number;
  winRate:        number;
  xp:             number;
  level:          number;
  ghostMode:      boolean;
  avatarColor:    string;
  isCurrentUser:  boolean;
  createdAt:      string;
}

export interface LeaderboardUserProfile extends LeaderboardEntry {
  achievements:     string[];
  topHoldings:      TopHolding[];
  recentTrades:     RecentTrade[];
  sectorAllocation: Record<string, number>;
}

export interface TopHolding {
  symbol:       string;
  companyName:  string;
  currentValue: number;
  pnlPercent:   number;
  pnl:          number;
}

export interface RecentTrade {
  _id:       string;
  symbol:    string;
  type:      "BUY" | "SELL";
  quantity:  number;
  price:     number;
  total:     number;
  createdAt: string;
}

export interface LeaderboardStats {
  totalPlayers:     number;
  highestPortfolio: number;
  averageReturn:    number;
  highestXp:        number;
  todayTopGainer:   { name: string; returnsPercent: number } | null;
  todayTopLoser:    { name: string; returnsPercent: number } | null;
}

export interface LeaderboardResponse {
  entries:    LeaderboardEntry[];
  total:      number;
  page:       number;
  totalPages: number;
  myEntry:    LeaderboardEntry | null;
  stats:      LeaderboardStats;
}

export type LeaderboardType   = "global" | "weekly" | "monthly" | "alltime" | "friends";
export type LeaderboardSortBy = "returnsPercent" | "portfolioValue" | "totalPnl" | "xp" | "level" | "totalTrades" | "winRate";

export interface GroupData {
  _id:         string;
  name:        string;
  inviteCode:  string;
  ownerId:     string;
  memberCount: number;
  role:        "owner" | "member";
  createdAt:   string;
}

export interface GroupMemberEntry extends LeaderboardEntry {
  joinedAt: string;
}