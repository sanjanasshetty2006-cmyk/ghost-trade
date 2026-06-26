import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WatchlistModel from "@/models/Watchlist";
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

    const items = await WatchlistModel.find({
      userId: payload.userId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error("Watchlist GET error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { symbol, companyName, exchange } = await req.json();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: "Symbol required" },
        { status: 400 }
      );
    }

    const existing = await WatchlistModel.findOne({
      userId: payload.userId,
      symbol: symbol.toUpperCase(),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Already in watchlist" },
        { status: 409 }
      );
    }

    const item = await WatchlistModel.create({
      userId: payload.userId,
      symbol: symbol.toUpperCase(),
      companyName: companyName ?? symbol,
      exchange: exchange ?? "NSE",
    });

    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Watchlist POST error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { symbol } = await req.json();

    await WatchlistModel.deleteOne({
      userId: payload.userId,
      symbol: symbol.toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      message: "Removed from watchlist",
    });
  } catch (err) {
    console.error("Watchlist DELETE error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}