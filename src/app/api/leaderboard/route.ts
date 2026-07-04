import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { buildLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardType, LeaderboardSortBy } from "@/types/leaderboard";

const VALID_TYPES:   Set<string> = new Set(["global", "weekly", "monthly", "alltime", "college", "friends"]);
const VALID_SORTS:   Set<string> = new Set(["portfolioValue", "returnsPercent", "totalPnl", "xp", "level", "totalTrades", "winRate"]);

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const type    = (searchParams.get("type")    ?? "global") as LeaderboardType;
    const sortBy  = (searchParams.get("sortBy")  ?? "portfolioValue") as LeaderboardSortBy;
    const college = searchParams.get("college")  ?? undefined;
    const search  = searchParams.get("search")   ?? undefined;
    const page    = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ success: false, error: "Invalid type parameter" }, { status: 400 });
    }
    if (!VALID_SORTS.has(sortBy)) {
      return NextResponse.json({ success: false, error: "Invalid sortBy parameter" }, { status: 400 });
    }

    const result = await buildLeaderboard({
      type,
      sortBy,
      college,
      search,
      page,
      limit,
      currentUserId: payload?.userId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[leaderboard] error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}