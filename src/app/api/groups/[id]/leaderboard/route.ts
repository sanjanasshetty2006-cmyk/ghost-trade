import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GroupModel from "@/models/group";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const group = await GroupModel.findById(params.id);

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: "Group not found",
        },
        { status: 404 }
      );
    }

    const leaderboard = await Promise.all(
      group.members.map(async (memberId: any) => {
        const user = await UserModel.findById(memberId);

        if (!user) return null;

        const holdings = await HoldingModel.find({
          userId: memberId,
        });

        const portfolioValue =
          holdings.reduce(
            (sum, h) => sum + h.avgBuyPrice * h.quantity,
            0
          ) + user.cashBalance;

        const returns =
          ((portfolioValue - 1000000) / 1000000) * 100;

        return {
          userId: user._id,
          name: user.ghostMode
            ? "Ghost Trader 👻"
            : user.name,
          college: user.ghostMode
            ? "Anonymous"
            : user.college ?? "Independent",
          portfolioValue,
          returns,
          trades: user.totalTrades,
          xp: user.xp,
          level: user.level,
          ghostMode: user.ghostMode,
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

    return NextResponse.json({
      success: true,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          code: group.code,
        },
        leaderboard: ranked,
      },
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}