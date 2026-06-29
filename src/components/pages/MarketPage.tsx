"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/useStore";
import { useAuthStore } from "@/store/useStore";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface Stock {
  symbol: string; name: string; price: number;
  change: number; changePercent: number;
  marketCap: number; volume: number; exchange: string;
}

const TABS = ["All Stocks", "Tech", "Banking", "Energy", "Watchlist"];
const TECH_STOCKS = ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"];

const BANKING_STOCKS = ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"];

const ENERGY_STOCKS = ["RELIANCE", "ADANIGREEN", "ONGC", "NTPC", "POWERGRID"];

export default function MarketPage() {
  const { token } = useAuthStore();
  const { setPage, setTradeStock } = useUIStore();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const authHeader: Record<string, string> = {};

  if (token) {
     authHeader.Authorization = `Bearer ${token}`;
  }

  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch("/api/market/trending");
      const json = await res.json();
      if (json.success) setStocks(json.data.all ?? []);
    } catch { toast("Failed to load market data", "error"); }
    finally { setLoading(false); }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/watchlist", { headers: authHeader });
      const json = await res.json();
      if (json.success) setWatchlist(json.data.map((w: { symbol: string }) => w.symbol));
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchMarket(); fetchWatchlist(); }, [fetchMarket, fetchWatchlist]);

 async function handleSearch(q: string) {
  setSearch(q);

  if (q.length < 2) {
    fetchMarket();
    return;
  }

  try {
    const res = await fetch(
      `/api/market/search?q=${encodeURIComponent(q)}`
    );

    const json = await res.json();

    if (!json.success) return;

    const stocksWithPrices = await Promise.all(
      json.data.map(
        async (r: {
          symbol: string;
          description: string;
        }) => {
          try {
            const quoteRes = await fetch(
              `/api/market/quote?symbol=${encodeURIComponent(
                r.symbol
              )}`
            );

            const quoteJson = await quoteRes.json();

            if (quoteJson.success) {
              return {
                symbol: quoteJson.data.symbol,
                name: r.description,
                price: quoteJson.data.price,
                change: quoteJson.data.change,
                changePercent:
                  quoteJson.data.changePercent,
                marketCap:
                  quoteJson.data.marketCap ?? 0,
                volume:
                  quoteJson.data.volume ?? 0,
                exchange:
                  quoteJson.data.exchange ?? "NSE",
              };
            }
          } catch {}

          return {
            symbol: r.symbol,
            name: r.description,
            price: 0,
            change: 0,
            changePercent: 0,
            marketCap: 0,
            volume: 0,
            exchange: "NSE",
          };
        }
      )
    );

    setStocks(stocksWithPrices);
  } catch {
    // silent
  }
}

  async function toggleWatchlist(stock: Stock) {
    if (!token) { router.push("/login"); return; }
    const inList = watchlist.includes(stock.symbol);
    try {
      if (inList) {
        await fetch("/api/watchlist", { method: "DELETE", headers: { ...authHeader, "Content-Type": "application/json" }, body: JSON.stringify({ symbol: stock.symbol }) });
        setWatchlist(w => w.filter(s => s !== stock.symbol));
        toast(`${stock.symbol} removed from watchlist`);
      } else {
        await fetch("/api/watchlist", { method: "POST", headers: { ...authHeader, "Content-Type": "application/json" }, body: JSON.stringify({ symbol: stock.symbol, companyName: stock.name, exchange: stock.exchange }) });
        setWatchlist(w => [...w, stock.symbol]);
        toast(`${stock.symbol} added to watchlist ⭐`);
      }
    } catch { toast("Failed to update watchlist", "error"); }
  }

  function goTrade(stock: Stock) {
    setTradeStock(stock.symbol, stock.name, stock.price);
    setPage("trade");
    router.push("/dashboard?page=trade");
  }

  let displayed = [...stocks];
  console.log("TAB =", tab);

  if (tab === 1)
    displayed = stocks.filter((s) => TECH_STOCKS.includes(s.symbol));

  if (tab === 2)
    displayed = stocks.filter((s) => BANKING_STOCKS.includes(s.symbol));

  if (tab === 3)
    displayed = stocks.filter((s) => ENERGY_STOCKS.includes(s.symbol));

  if (tab === 4)
    displayed = stocks.filter((s) => watchlist.includes(s.symbol));

   console.log("Displayed:", displayed.map((s) => s.symbol));
  return (
    <div className="page-enter px-6 py-5">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-head text-xl font-bold mb-0.5" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Market Explorer</h1>
        <p className="text-xs" style={{ color: "var(--text2)" }}>Real-time Indian stock market data</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <span style={{ color: "var(--text3)" }}>🔍</span>
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text)", fontFamily: "DM Sans,sans-serif" }}
          placeholder="Search stocks, companies..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => { setSearch(""); fetchMarket(); }} style={{ color: "var(--text3)" }}>✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all"
            style={{
              color: tab === i ? "var(--accent)" : "var(--text2)",
              background: tab === i ? "rgba(0,255,136,0.08)" : "transparent",
              borderColor: tab === i ? "rgba(0,255,136,0.2)" : "transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[10px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="grid gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.5px] border-b"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 110px", color: "var(--text3)", borderColor: "var(--border)", background: "var(--bg2)" }}>
          <div>Company</div><div className="text-right">Price</div><div className="text-right">Change</div>
          <div className="text-right">Mkt Cap</div><div className="text-right">Action</div>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text3)" }}>Loading market data...</div>
        ) : displayed.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text3)" }}>
            {tab === 4 ? "Your watchlist is empty. Add stocks to track them." : "No stocks found."}
          </div>
        ) : (
          displayed.map((s, i) => (
            <motion.div
              key={s.symbol}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid gap-2 px-3 py-2.5 border-b last:border-b-0 items-center cursor-pointer transition-all"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 110px", borderColor: "rgba(255,255,255,0.03)" }}
              onClick={() => s.price > 0 && goTrade(s)}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--card)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div className="text-[13px] font-bold font-mono" style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>{s.symbol}</div>
                <div className="text-[11px] truncate" style={{ color: "var(--text2)" }}>{s.name}</div>
              </div>
              <div className="text-right text-[13px] font-semibold font-mono" style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>
                {s.price > 0 ? `₹${s.price.toLocaleString("en-IN")}` : "—"}
              </div>
              <div className="text-right text-xs font-semibold font-mono" style={{ fontFamily: "Space Mono,monospace", color: s.changePercent >= 0 ? "var(--accent)" : "var(--red)" }}>
                {s.price > 0 ? `${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%` : "—"}
              </div>
              <div className="text-right text-xs" style={{ color: "var(--text2)" }}>
                {s.marketCap > 0 ? `₹${(s.marketCap / 100000).toFixed(0)}Cr` : "—"}
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={e => { e.stopPropagation(); toggleWatchlist(s); }}
                  className="text-xs px-1.5 py-0.5 rounded transition-all"
                  style={{ color: watchlist.includes(s.symbol) ? "var(--yellow)" : "var(--text3)" }}
                  title={watchlist.includes(s.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                >
                  {watchlist.includes(s.symbol) ? "★" : "☆"}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); goTrade(s); }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded transition-all"
                  style={{ background: "rgba(0,255,136,0.1)", color: "var(--accent)", fontFamily: "Space Mono,monospace" }}
                >
                  TRADE
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
