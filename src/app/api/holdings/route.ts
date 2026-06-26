import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HoldingModel from "@/models/Holding";
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

    
    const holdings = await HoldingModel.find({  userId: payload.userId,
    }).sort({ totalInvested: -1 });

    return NextResponse.json({
      success: true,
      data: holdings,
    });
  } catch (err) {
    console.error("Holdings error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}