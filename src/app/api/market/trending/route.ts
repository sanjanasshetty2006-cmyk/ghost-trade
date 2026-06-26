import { NextResponse } from "next/server";
import { getBatchQuotes, DEFAULT_NSE_SYMBOLS } from "@/lib/yahoo";

export async function GET() {
  try {
    const quotesMap = await getBatchQuotes(DEFAULT_NSE_SYMBOLS);
    const stocks = Array.from(quotesMap.values());

    return NextResponse.json({
      success: true,
      data: {
        all: stocks,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market data",
      },
      { status: 500 }
    );
  }
}