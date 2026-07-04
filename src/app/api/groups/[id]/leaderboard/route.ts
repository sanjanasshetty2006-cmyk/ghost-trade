// Next.js 15 App Router — dynamic route params are a Promise
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { buildLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardSortBy } from "@/types/leaderboard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await params;
    const payload  = await getUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const sortBy = (searchParams.get("sortBy") ?? "portfolioValue") as LeaderboardSortBy;
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    // "id" here is the college name / group slug
    const result = await buildLeaderboard({
      type:           "college",
      sortBy,
      college:        id,
      page,
      limit,
      currentUserId:  payload?.userId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[groups/leaderboard] error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}