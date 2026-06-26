import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";
import TransactionModel from "@/models/Transaction";
import GroupModel from "@/models/group";
import { getUserFromRequest } from "@/lib/auth";

const MOCK_STOCKS: any[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") ?? "global";
  const groupId = searchParams.get("groupId");

  try {
    const payload = await getUserFromRequest(req);

    await connectDB();

    let transactionFilter = {};

    if (type === "weekly") {
      const start = new Date();
      start.setDate(start.getDate() - 7);

      transactionFilter = {
        createdAt: { $gte: start },
      };
    }

    if (type === "monthly") {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);

      transactionFilter = {
        createdAt: { $gte: start },
      };
    }

    // -----------------------------
    // Get users
    // -----------------------------

    let users;

    if (type === "friends") {
      if (!groupId) {
        return NextResponse.json(
          {
            success: false,
            error: "Group id required",
          },
          { status: 400 }
        );
      }

      const group = await GroupModel.findById(groupId);

      if (!group) {
        return NextResponse.json(
          {
            success: false,
            error: "Group not found",
          },
          { status: 404 }
        );
      }

      users = await UserModel.find({
        _id: { $in: group.members },
      }).select(
        "name college cashBalance xp level ghostMode totalTrades"
      );
    } else {
      users = await UserModel.find({})
        .select(
          "name college cashBalance xp level ghostMode totalTrades"
        )
        .limit(50);
    }

    // -----------------------------
    // Build leaderboard
    // -----------------------------

    const leaderboard = await Promise.all(
      users.map(async (u: any) => {
        const tradeCount =
          type === "global" || type === "friends"
            ? u.totalTrades
            : await TransactionModel.countDocuments({
                userId: u._id,
                ...transactionFilter,
              });

        if (
          (type === "weekly" || type === "monthly") &&
          tradeCount === 0
        ) {
          return null;
        }

        const holdings = await HoldingModel.find({
          userId: u._id,
        });

        const investedValue = holdings.reduce((sum: number, h: any) => {
          const mock = MOCK_STOCKS.find(
            (m) => m.symbol === h.symbol
          );

          const price = mock?.price ?? h.avgBuyPrice;

          return sum + price * h.quantity;
        }, 0);

        const totalValue = u.cashBalance + investedValue;

        const returns =
          ((totalValue - 1000000) / 1000000) * 100;

        return {
          userId: u._id.toString(),
          name: u.ghostMode
            ? "Ghost Trader 👻"
            : u.name,
          college: u.ghostMode
            ? "Anonymous"
            : (u.college ?? "Independent"),
          returns: Math.round(returns * 100) / 100,
          portfolioValue: Math.round(totalValue),
          trades: tradeCount,
          ghostMode: u.ghostMode,
          xp: u.xp,
          level: u.level,
        };
      })
    );

    const ranked = leaderboard
      .filter(Boolean)
      .sort((a: any, b: any) => b.returns - a.returns)
      .map((e: any, i: number) => ({
        ...e,
        rank: i + 1,
      }));

    const myRank = payload
      ? ranked.find(
          (e: any) => e.userId === payload.userId
        ) ?? null
      : null;

    return NextResponse.json({
      success: true,
      data: {
        leaderboard:
          type === "friends"
            ? ranked
            : ranked.slice(0, 20),
        myRank,
      },
    });
  } catch (err) {
    console.error("Leaderboard error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}