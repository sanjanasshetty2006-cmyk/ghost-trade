import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";
import TransactionModel from "@/models/Transaction";
import type { LeaderboardUserProfile } from "@/types/leaderboard";

const AVATAR_COLORS = [
  "#00FF88", "#3b82f6", "#ffd700", "#ff6b35",
  "#a855f7", "#06b6d4", "#f43f5e", "#84cc16",
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const payload    = await getUserFromRequest(req);

    await connectDB();

    const user = await UserModel.findById(userId)
      .select("name college cashBalance xp level ghostMode achievements totalTrades createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const isGhost   = user.ghostMode;
    const isOwner   = payload?.userId === userId;
    // Reveal identity if: it's the owner viewing their own profile, or ghost mode is off
    const reveal    = isOwner || !isGhost;

    const [holdings, allSellTx, recentTx] = await Promise.all([
      HoldingModel.find({ userId }).lean(),
      TransactionModel.find({ userId, type: "SELL", status: "EXECUTED" }).select("pnl").lean(),
      TransactionModel.find({ userId, status: "EXECUTED" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const investedValue        = holdings.reduce((s, h) => s + h.totalInvested, 0);
    const currentValueEstimate = holdings.reduce((s, h) => s + h.avgBuyPrice * h.quantity, 0);
    const unrealizedPnl        = currentValueEstimate - investedValue;
    const realizedPnl          = allSellTx.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const totalPnl             = realizedPnl + unrealizedPnl;
    const portfolioValue       = user.cashBalance + currentValueEstimate;
    const returnsPercent       = ((portfolioValue - 1_000_000) / 1_000_000) * 100;
    const winningSells         = allSellTx.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate              = allSellTx.length > 0
      ? Math.round((winningSells / allSellTx.length) * 100)
      : 0;

    // Sector allocation
    const sectorAlloc: Record<string, number> = {};
    if (currentValueEstimate > 0) {
      for (const h of holdings) {
        const s = (h as unknown as { sector?: string }).sector || "Other";
        sectorAlloc[s] = (sectorAlloc[s] ?? 0) + h.avgBuyPrice * h.quantity;
      }
      for (const k of Object.keys(sectorAlloc)) {
        sectorAlloc[k] = Math.round((sectorAlloc[k] / currentValueEstimate) * 100);
      }
    }

    // Top holdings
    const topHoldings = holdings
      .map((h) => {
        const cv  = h.avgBuyPrice * h.quantity;
        const pnl = cv - h.totalInvested;
        return {
          symbol:       h.symbol,
          companyName:  h.companyName,
          currentValue: cv,
          pnlPercent:   h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0,
          pnl,
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5);

    const profile: LeaderboardUserProfile = {
      rank:           0, // caller can compute from full leaderboard
      userId,
      name:           reveal ? user.name : "Ghost Trader 👻",
      initials:       reveal ? initials(user.name) : "👻",
      college:        reveal ? (user.college ?? "Independent") : "Anonymous",
      portfolioValue: Math.round(portfolioValue),
      returnsPercent: Math.round(returnsPercent * 100) / 100,
      totalPnl:       Math.round(totalPnl * 100) / 100,
      realizedPnl:    Math.round(realizedPnl * 100) / 100,
      unrealizedPnl:  Math.round(unrealizedPnl * 100) / 100,
      cashBalance:    user.cashBalance,
      totalTrades:    user.totalTrades,
      winningTrades:  winningSells,
      winRate,
      xp:             user.xp,
      level:          user.level,
      ghostMode:      isGhost,
      avatarColor:    avatarColor(userId),
      isCurrentUser:  isOwner,
      createdAt:      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : String(user.createdAt),
      achievements:   reveal ? (user.achievements ?? []) : [],
      topHoldings:    reveal ? topHoldings : [],
      recentTrades:   reveal
        ? recentTx.map((t) => ({
            _id:       t._id.toString(),
            symbol:    t.symbol,
            type:      t.type as "BUY" | "SELL",
            quantity:  t.quantity,
            price:     t.price,
            total:     t.total,
            createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
          }))
        : [],
      sectorAllocation: reveal ? sectorAlloc : {},
    };

    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    console.error("[leaderboard/user] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}