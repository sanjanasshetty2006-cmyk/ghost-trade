import yahooFinance from "yahoo-finance2";
import type { StockQuote, CompanyProfile, CandleData } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Symbol helpers
// NSE stocks use .NS suffix on Yahoo Finance (e.g. RELIANCE → RELIANCE.NS)
// BSE stocks use .BO suffix
// ─────────────────────────────────────────────────────────────────────────────

export function toYahooSymbol(symbol: string): string {
  if (symbol.includes(".")) return symbol; // already has suffix
  return `${symbol.toUpperCase()}.NS`;     // default to NSE
}

export function fromYahooSymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO|L|AX|TO)$/i, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// getQuote — single symbol
// Uses: yahooFinance.quote(symbol) — confirmed in quote.d.ts
// ─────────────────────────────────────────────────────────────────────────────
const SYMBOL_INDUSTRY: Record<string, string> = {
  TCS: "Technology",
  INFY: "Technology",
  HDFCBANK: "Banking",
  ICICIBANK: "Banking",
  SBIN: "Banking",
  RELIANCE: "Energy",
  ADANIGREEN: "Renewable Energy",
  TATAMOTORS: "Automobile",
  SUNPHARMA: "Pharma",
  NESTLEIND: "FMCG",
};
export async function getQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const yahooSym = toYahooSymbol(symbol);

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Yahoo HTTP Error:", res.status);
      return null;
    }

    const json = await res.json();

    const meta = json?.chart?.result?.[0]?.meta;

    if (!meta?.regularMarketPrice) {
      return null;
    }

    return {
      symbol: fromYahooSymbol(yahooSym),
      price: meta.regularMarketPrice,
      change:
        meta.regularMarketPrice - (meta.previousClose ?? meta.regularMarketPrice),
      changePercent:
        meta.previousClose
          ? ((meta.regularMarketPrice - meta.previousClose) /
              meta.previousClose) *
            100
          : 0,
      high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      open: meta.regularMarketOpen ?? meta.regularMarketPrice,
      prevClose: meta.previousClose ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      marketCap:
          meta.marketCap ??
         meta.totalMarketCap ??
          0,
      companyName: meta.symbol,
      exchange: meta.exchangeName ?? "NSE",
      industry: undefined,
    };
  } catch (err) {
    console.error("DIRECT YAHOO ERROR:", err);
    return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// getBatchQuotes — multiple symbols in one call
// Uses: yahooFinance.quote(string[], { return: "map" }) — confirmed in quote.d.ts
// ─────────────────────────────────────────────────────────────────────────────

export async function getBatchQuotes(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const result = new Map<string, StockQuote>();

  for (const symbol of symbols) {
    try {
      const quote = await getQuote(symbol);

      if (quote) {
        result.set(quote.symbol, quote);
      }

      // prevent Yahoo rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      // skip failed symbol
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// getCompanyProfile
// quoteSummary does NOT exist in this build.
// Use the quote() result for the fields that are available.
// ─────────────────────────────────────────────────────────────────────────────

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    const yahooSym = toYahooSymbol(symbol);
    const q = await yahooFinance.quote(yahooSym);

    if (!q) return null;
  
    console.log("FULL QUOTE OBJECT");
    console.dir(q, { depth: null });
    
    return {
      symbol,
      name:             q.longName ?? q.shortName ?? symbol,
      exchange:         q.exchange ?? "NSE",
      industry:         (q as any).industry ?? (q as any).sector ?? "Unknown",
      sector: (q as any).sector ?? "Other",
      marketCap:        q.marketCap ?? 0,
      shareOutstanding: q.sharesOutstanding ?? 0,
      logo:             "",
      weburl:           "",
      pe:               q.trailingPE ?? undefined,
      week52High:       q.fiftyTwoWeekHigh ?? undefined,
      week52Low:        q.fiftyTwoWeekLow  ?? undefined,
    };
  } catch (err) {
    console.error(`[yahoo] getCompanyProfile failed for ${symbol}:`, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getCandles — historical OHLCV data
// historical() does NOT exist in this build.
// Use Yahoo Finance's chart endpoint directly via fetch (no API key needed).
// This is the same data source the library wraps.
// ─────────────────────────────────────────────────────────────────────────────

interface YahooChartMeta {
  currency: string;
  symbol: string;
  regularMarketPrice: number;
  chartPreviousClose: number;
}
interface YahooChartIndicatorQuote {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
}
interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp: number[];
  indicators: {
    quote: YahooChartIndicatorQuote[];
  };
}
interface YahooChartResponse {
  chart: {
    result: YahooChartResult[] | null;
    error: { code: string; description: string } | null;
  };
}

export async function getCandles(
  symbol: string,
  resolution = "D",
  from?: number,
  to?: number
): Promise<CandleData | null> {
  try {
    const yahooSym = toYahooSymbol(symbol);
    const now      = to   ?? Math.floor(Date.now() / 1000);
    const start    = from ?? now - 90 * 24 * 60 * 60;

    // Map resolution to Yahoo Finance interval and range params
    const intervalMap: Record<string, string> = {
      "1":  "1m",
      "5":  "5m",
      "15": "15m",
      "30": "30m",
      "60": "1h",
      "D":  "1d",
      "W":  "1wk",
      "M":  "1mo",
    };
    const interval = intervalMap[resolution] ?? "1d";

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}` +
      `?period1=${start}&period2=${now}&interval=${interval}&includePrePost=false`;

    const res = await fetch(url, {
      headers: {
        // Yahoo requires a User-Agent — Node.js fetch sends none by default
        "User-Agent": "Mozilla/5.0 (compatible; GhostTrade/1.0)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[yahoo] chart fetch failed: HTTP ${res.status} for ${yahooSym}`);
      return null;
    }

    const json = await res.json() as YahooChartResponse;
    const chartResult = json?.chart?.result?.[0];

    if (!chartResult?.timestamp?.length) return null;

    const timestamps = chartResult.timestamp;
    const ohlcv      = chartResult.indicators.quote[0];

    const t: number[] = [];
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const c: number[] = [];
    const v: number[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const close = ohlcv.close[i];
      if (close === null || close === undefined) continue;

      t.push(timestamps[i]);
      o.push(ohlcv.open[i]   ?? close);
      h.push(ohlcv.high[i]   ?? close);
      l.push(ohlcv.low[i]    ?? close);
      c.push(close);
      v.push(ohlcv.volume[i] ?? 0);
    }

    if (t.length === 0) return null;

    return { t, o, h, l, c, v, s: "ok" };
  } catch (err) {
    console.error(`[yahoo] getCandles failed for ${symbol}:`, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// searchSymbol
// search() does NOT exist in this build.
// autoc() exists but only returns symbol strings, no metadata.
// Use Yahoo Finance's search endpoint directly via fetch.
// ─────────────────────────────────────────────────────────────────────────────

interface YahooSearchQuote {
  symbol:     string;
  longname?:  string;
  shortname?: string;
  quoteType?: string;
  exchange?:  string;
}
interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
}

export async function searchSymbol(
  query: string
): Promise<Array<{ symbol: string; description: string; type: string }>> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GhostTrade/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const json = await res.json() as YahooSearchResponse;
    const quotes = json?.quotes ?? [];

    return quotes
      .filter((q): q is YahooSearchQuote & { symbol: string } => !!q.symbol)
      .map((q) => ({
        symbol:      fromYahooSymbol(q.symbol),
        description: q.longname ?? q.shortname ?? q.symbol,
        type:        q.quoteType ?? "EQUITY",
      }))
      .slice(0, 10);
  } catch (err) {
    console.error("[yahoo] searchSymbol failed:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getMarketNews
// No news module exists in this build.
// Use Yahoo Finance's news endpoint directly via fetch.
// ─────────────────────────────────────────────────────────────────────────────

interface YahooNewsItem {
  title:                string;
  link:                 string;
  publisher?:           string;
  providerPublishTime?: number;
  thumbnail?:           { resolutions?: Array<{ url: string }> };
}
interface YahooNewsResponse {
  news?: YahooNewsItem[];
}

export async function getMarketNews(): Promise<
  Array<{
    headline: string;
    summary: string;
    url: string;
    source: string;
    datetime: number;
    image: string;
  }>
> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=NIFTY+NSE+India&quotesCount=0&newsCount=20&enableFuzzyQuery=false`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GhostTrade/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const json = await res.json() as YahooNewsResponse;
    const news = json?.news ?? [];

    return news.map((n) => ({
      headline: n.title,
      summary:  n.title,
      url:      n.link,
      source:   n.publisher   ?? "Yahoo Finance",
      datetime: n.providerPublishTime ?? Math.floor(Date.now() / 1000),
      image:    n.thumbnail?.resolutions?.[0]?.url ?? "",
    }));
  } catch (err) {
    console.error("[yahoo] getMarketNews failed:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_NSE_SYMBOLS
// Shown on the Markets page trending section.
// All verified listed on NSE and available via Yahoo Finance .NS suffix.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_NSE_SYMBOLS = [
  // Tech
  "TCS",
  "INFY",
  "WIPRO",
  "HCLTECH",
  "TECHM",
  "LTIM",

  // Banking & Finance
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "AXISBANK",
  "KOTAKBANK",
  "BAJFINANCE",

  // Energy
  "RELIANCE",
  "ADANIGREEN",
  "ONGC",
  "NTPC",
  "POWERGRID",

  // Auto
  "TATAMOTORS",
  "MARUTI",

  // Consumer
  "ASIANPAINT",
  "NESTLEIND",

  // Pharma
  "SUNPHARMA",
];