import { NextRequest, NextResponse } from "next/server";
import { getQuote, getCompanyProfile, getCandles } from "@/lib/yahoo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") ?? "quote";

  if (!symbol) {
    return NextResponse.json(
      {
        success: false,
        error: "symbol required",
      },
      { status: 400 }
    );
  }

  try {
    if (type === "candles") {
      const resolution =
        searchParams.get("resolution") ?? "D";

      const candles = await getCandles(
        symbol,
        resolution
      );

      if (!candles) {
        return NextResponse.json(
          {
            success: false,
            error: "Candles not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: candles,
      });
    }

    if (type === "profile") {
      const profile =
        await getCompanyProfile(symbol);

      if (!profile) {
        return NextResponse.json(
          {
            success: false,
            error: "Profile not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: profile,
      });
    }

    // Default: Quote
    const quote = await getQuote(symbol);

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: "Quote not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (err) {
    console.error("Quote error:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch quote",
      },
      { status: 500 }
    );
  }
}