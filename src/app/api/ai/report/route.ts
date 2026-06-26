import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { generatePortfolioReport } from "@/lib/gemini";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import HoldingModel from "@/models/Holding";
import TransactionModel from "@/models/Transaction";

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reportType } = await req.json();

    const validTypes = [
      "health",
      "weekly",
      "monthly",
      "risk",
      "diversification",
    ];

    if (!validTypes.includes(reportType)) {
      return NextResponse.json(
        { success: false, error: "Invalid report type" },
        { status: 400 }
      );
    }

    await connectDB();

    const [user, holdings, transactions] = await Promise.all([
      UserModel.findById(payload.userId).select(
        "name cashBalance xp level totalTrades"
      ),
      HoldingModel.find({ userId: payload.userId }),
      TransactionModel.find({ userId: payload.userId })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    const portfolioData = `
User: ${user?.name}
Cash Balance: ₹${user?.cashBalance.toLocaleString("en-IN")}
Total Trades: ${user?.totalTrades}
Level: ${user?.level} | XP: ${user?.xp}

Holdings (${holdings.length}):
${holdings
  .map(
    (h) =>
      `${h.symbol}: ${h.quantity} shares @ avg ₹${h.avgBuyPrice} (invested ₹${h.totalInvested.toLocaleString(
        "en-IN"
      )})`
  )
  .join("\n")}

Recent Transactions:
${transactions
  .slice(0, 10)
  .map((t) => `${t.type} ${t.quantity} ${t.symbol} @ ₹${t.price}`)
  .join(", ")}
`.trim();

    const report = await generatePortfolioReport(
      reportType as
        | "health"
        | "weekly"
        | "monthly"
        | "risk"
        | "diversification",
      portfolioData
    );

    return NextResponse.json({
      success: true,
      data: {
        report,
        reportType,
      },
    });
  } catch (err) {
    console.error("Report error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Report generation failed",
      },
      { status: 500 }
    );
  }
}