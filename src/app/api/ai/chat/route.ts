import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { askGhostAI } from "@/lib/gemini";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message required" },
        { status: 400 }
      );
    }

    await connectDB();

    const [user, holdings] = await Promise.all([
      UserModel.findById(payload.userId).select(
        "name cashBalance xp level"
      ),
      HoldingModel.find({ userId: payload.userId }),
    ]);

    const portfolioContext = user
      ? `User: ${user.name} | Cash: ₹${user.cashBalance.toLocaleString(
          "en-IN"
        )} | Level: ${user.level} | XP: ${user.xp} | Holdings: ${
          holdings
            .map(
              (h) =>
                `${h.symbol}(${h.quantity}@₹${h.avgBuyPrice})`
            )
            .join(", ") || "None yet"
        }`
      : "";

    const reply = await askGhostAI(message, portfolioContext);

    return NextResponse.json({
      success: true,
      data: { reply },
    });
  } catch (err) {
    console.error("AI chat error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "AI service unavailable",
      },
      { status: 500 }
    );
  }
}