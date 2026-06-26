import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const transactions = await TransactionModel.find({
      userId: payload.userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    console.error("Transactions error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}