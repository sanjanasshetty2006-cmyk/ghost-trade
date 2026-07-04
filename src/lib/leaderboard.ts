import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";
import TransactionModel from "@/models/Transaction";
import type {
  LeaderboardEntry,
  LeaderboardStats,
  LeaderboardType,
  LeaderboardSortBy,
} from "@/types/leaderboard";

// ── Avatar colour palette ─────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#00FF88", "#3b82f6", "#ffd700", "#ff6b35",
  "#a855f7", "#06b6d4", "#f43f5e", "#84cc16",
  "#f59e0b", "#ec4899",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Get the Monday of the current week (UTC) ──────────────────────────────────
export function currentWeekStart(): Date {
  const now  = new Date();
  const day  = now.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

// ── Build date filter for weekly / monthly ────────────────────────────────────
function dateFilter(type: LeaderboardType): Date | null {
  const now = new Date();
  if (type === "weekly") {
    return currentWeekStart();
  }
  if (type === "monthly") {
    const start = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }
  return null; // global / alltime: no date filter
}

// ── Core leaderboard builder ──────────────────────────────────────────────────
export interface LeaderboardOptions {
  type:        LeaderboardType;
  sortBy:      LeaderboardSortBy;
  college?:    string;
  search?:     string;
  page:        number;
  limit:       number;
  currentUserId?: string;
}

export async function buildLeaderboard(opts: LeaderboardOptions): Promise<{
  entries:    LeaderboardEntry[];
  total:      number;
  page:       number;
  totalPages: number;
  myEntry:    LeaderboardEntry | null;
  stats:      LeaderboardStats;
}> {
  await connectDB();

  // ── 1. Build user filter ──────────────────────────────────────────────────
  const userFilter: Record<string, unknown> = {};
  if (opts.college) {
    userFilter.college = { $regex: opts.college, $options: "i" };
  }
  if (opts.search) {
    userFilter.$or = [
      { name:    { $regex: opts.search, $options: "i" } },
      { college: { $regex: opts.search, $options: "i" } },
      { email:   { $regex: opts.search, $options: "i" } },
    ];
  }

  // ── 2. Fetch users ────────────────────────────────────────────────────────
  const users = await UserModel
    .find(userFilter)
    .select("name college cashBalance xp level ghostMode achievements totalTrades createdAt")
    .lean();

  if (users.length === 0) {
    return {
      entries: [], total: 0, page: opts.page, totalPages: 0,
      myEntry: null,
      stats: { totalPlayers: 0, highestPortfolio: 0, averageReturn: 0, highestXp: 0, todayTopGainer: null, todayTopLoser: null },
    };
  }

  const userIds = users.map((u) => u._id);

  // ── 3. Fetch all holdings and transactions in bulk (avoid N+1) ────────────
  const [allHoldings, allSellTx] = await Promise.all([
    HoldingModel.find({ userId: { $in: userIds } })
      .select("userId symbol quantity avgBuyPrice totalInvested")
      .lean(),
    TransactionModel.find({ userId: { $in: userIds }, type: "SELL", status: "EXECUTED" })
      .select("userId pnl")
      .lean(),
  ]);

  // ── 4. Index holdings + transactions by userId ────────────────────────────
  const holdingsByUser  = new Map<string, typeof allHoldings>();
  const sellTxByUser    = new Map<string, typeof allSellTx>();

  for (const h of allHoldings) {
    const uid = h.userId.toString();
    if (!holdingsByUser.has(uid)) holdingsByUser.set(uid, []);
    holdingsByUser.get(uid)!.push(h);
  }
  for (const t of allSellTx) {
    const uid = t.userId.toString();
    if (!sellTxByUser.has(uid)) sellTxByUser.set(uid, []);
    sellTxByUser.get(uid)!.push(t);
  }

  // ── 5. Date filter for weekly/monthly ─────────────────────────────────────
  const since = dateFilter(opts.type);
  let tradeSinceByUser: Map<string, number> | null = null;
  if (since) {
    const recentTx = await TransactionModel.find({
      userId:    { $in: userIds },
      status:    "EXECUTED",
      createdAt: { $gte: since },
    }).select("userId pnl type").lean();

    tradeSinceByUser = new Map<string, number>();
    for (const t of recentTx) {
      const uid = t.userId.toString();
      tradeSinceByUser.set(uid, (tradeSinceByUser.get(uid) ?? 0) + (t.pnl ?? 0));
    }
  }

  // ── 6. Build entry for each user ──────────────────────────────────────────
  const STARTING_BALANCE = 1_000_000;

  const entries: LeaderboardEntry[] = users.map((u) => {
    const uid      = u._id.toString();
    const holdings = holdingsByUser.get(uid) ?? [];
    const sells    = sellTxByUser.get(uid)   ?? [];

    // Unrealized P&L uses avgBuyPrice as proxy for current price
    // (full live-price fetch would be too slow for 10k users)
    const investedValue = holdings.reduce((s, h) => s + h.totalInvested, 0);
    const currentValueEstimate = holdings.reduce((s, h) => s + h.avgBuyPrice * h.quantity, 0);
    const unrealizedPnl = currentValueEstimate - investedValue;
    const realizedPnl   = sells.reduce((s, t) => s + (t.pnl ?? 0), 0);

    // For weekly/monthly — use period-specific pnl if available
    const periodPnl = tradeSinceByUser
      ? (tradeSinceByUser.get(uid) ?? 0)
      : realizedPnl + unrealizedPnl;

    const portfolioValue  = u.cashBalance + currentValueEstimate;
    const returnsPercent  = ((portfolioValue - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    // Win rate = sells with pnl > 0 / total sells
    const winningSells    = sells.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate         = sells.length > 0
      ? Math.round((winningSells / sells.length) * 100)
      : 0;

    const isGhost = u.ghostMode;

    return {
      rank:           0, // assigned after sorting
      userId:         uid,
      name:           isGhost ? "Ghost Trader 👻" : u.name,
      initials:       isGhost ? "👻" : initials(u.name),
      college:        isGhost ? "Anonymous" : (u.college ?? "Independent"),
      portfolioValue: Math.round(portfolioValue),
      returnsPercent: Math.round(returnsPercent * 100) / 100,
      totalPnl:       Math.round((realizedPnl + unrealizedPnl) * 100) / 100,
      realizedPnl:    Math.round(realizedPnl * 100) / 100,
      unrealizedPnl:  Math.round(unrealizedPnl * 100) / 100,
      cashBalance:    u.cashBalance,
      totalTrades:    u.totalTrades,
      winningTrades:  winningSells,
      winRate,
      xp:             u.xp,
      level:          u.level,
      ghostMode:      isGhost,
      avatarColor:    avatarColor(uid),
      isCurrentUser:  uid === opts.currentUserId,
      createdAt:      u.createdAt instanceof Date
        ? u.createdAt.toISOString()
        : String(u.createdAt),
    };
  });

  // ── 7. Sort ───────────────────────────────────────────────────────────────
  const sortKey = opts.sortBy;
  entries.sort((a, b) => {
    const primary = b[sortKey] - a[sortKey];
    if (primary !== 0) return primary;
    // Tie-breakers
    if (b.returnsPercent !== a.returnsPercent) return b.returnsPercent - a.returnsPercent;
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // ── 8. Assign ranks ───────────────────────────────────────────────────────
  entries.forEach((e, i) => { e.rank = i + 1; });

  // ── 9. Stats ──────────────────────────────────────────────────────────────
  const totalPlayers     = entries.length;
  const highestPortfolio = entries[0]?.portfolioValue ?? 0;
  const averageReturn    = totalPlayers > 0
    ? Math.round(entries.reduce((s, e) => s + e.returnsPercent, 0) / totalPlayers * 100) / 100
    : 0;
  const highestXp        = entries.reduce((m, e) => Math.max(m, e.xp), 0);

  // Today's top gainer / loser by returnsPercent
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayTx = await TransactionModel.find({
    userId:    { $in: userIds },
    status:    "EXECUTED",
    createdAt: { $gte: todayStart },
  }).select("userId pnl").lean();

  const todayPnlByUser = new Map<string, number>();
  for (const t of todayTx) {
    const uid = t.userId.toString();
    todayPnlByUser.set(uid, (todayPnlByUser.get(uid) ?? 0) + (t.pnl ?? 0));
  }

  let todayTopGainer: { name: string; returnsPercent: number } | null = null;
  let todayTopLoser:  { name: string; returnsPercent: number } | null = null;

  for (const e of entries) {
    const pnl = todayPnlByUser.get(e.userId) ?? 0;
    const ret = e.portfolioValue > 0 ? (pnl / e.portfolioValue) * 100 : 0;
    if (pnl > 0 && (!todayTopGainer || ret > todayTopGainer.returnsPercent)) {
      todayTopGainer = { name: e.name, returnsPercent: Math.round(ret * 100) / 100 };
    }
    if (pnl < 0 && (!todayTopLoser || ret < todayTopLoser.returnsPercent)) {
      todayTopLoser = { name: e.name, returnsPercent: Math.round(ret * 100) / 100 };
    }
  }

  const stats: LeaderboardStats = {
    totalPlayers,
    highestPortfolio,
    averageReturn,
    highestXp,
    todayTopGainer,
    todayTopLoser,
  };

  // ── 10. Find current user's entry before slicing ──────────────────────────
  const myEntry = opts.currentUserId
    ? (entries.find((e) => e.userId === opts.currentUserId) ?? null)
    : null;

  // ── 11. Paginate ──────────────────────────────────────────────────────────
  const total      = entries.length;
  const totalPages = Math.ceil(total / opts.limit);
  const start      = (opts.page - 1) * opts.limit;
  const paginated  = entries.slice(start, start + opts.limit);

  return { entries: paginated, total, page: opts.page, totalPages, myEntry, stats };
}