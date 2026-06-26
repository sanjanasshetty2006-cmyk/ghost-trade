import { NextRequest, NextResponse } from "next/server";
import { searchSymbol } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { success: false, error: "Query required" },
      { status: 400 }
    );
  }

  try {
    const results = await searchSymbol(q);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error("[search]", err);

    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}