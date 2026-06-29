import type { StockQuote } from "@/types";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? "";
console.log("FINNHUB KEY EXISTS:", !!FINNHUB_KEY);
console.log("FINNHUB KEY LENGTH:", FINNHUB_KEY.length);
const BASE = "https://finnhub.io/api/v1";

export async function getMarketNews() {
  try {
    const news = await finnhub("/news", {
      category: "general",
    });

    return news;
  } catch (err) {
    console.error("Market news error:", err);
    return [];
  }
}
async function finnhub(
  path: string,
  params: Record<string, string | number> = {}
) {
  const url = new URL(`${BASE}${path}`);

  url.searchParams.set("token", FINNHUB_KEY);

  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Finnhub ${path} -> HTTP ${res.status}`);
  }

  return res.json();
}

export function toFinnhubSymbol(
  symbol: string,
  exchange = "NSE"
): string {
  const upper = symbol.toUpperCase();

  const US_SYMBOLS = new Set([
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "TSLA",
    "META",
    "NVDA",
  ]);

  if (upper.includes(".")) return upper;

  if (US_SYMBOLS.has(upper)) return upper;

  if (exchange === "NSE" || exchange === "BSE") {
    return `${upper}.NS`;
  }

  return upper;
}

export async function getQuote(
  symbol: string
): Promise<StockQuote | null> {
  try {
    const finnSym = toFinnhubSymbol(symbol);

    console.log("Fetching:", finnSym);

    const quote = await finnhub("/quote", {
      symbol: finnSym,
    });

    console.log("Quote:", quote);

    if (!quote) return null;

    if (
      quote.c === undefined ||
      quote.c === null ||
      Number.isNaN(quote.c)
    ) {
      return null;
    }

    return {
      symbol,
      price: quote.c,
      change: quote.d ?? 0,
      changePercent: quote.dp ?? 0,
      high: quote.h ?? quote.c,
      low: quote.l ?? quote.c,
      open: quote.o ?? quote.c,
      prevClose: quote.pc ?? quote.c,
      volume: 0,
      companyName: symbol,
      exchange: "NSE",
      industry: "Unknown",
      marketCap: 0,
    };
  } catch (err) {
    console.error("GETQUOTE ERROR:", err);
    return null;
  }
  
}