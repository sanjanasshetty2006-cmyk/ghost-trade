"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useUIStore } from "@/store/useStore";
import LineChart from "@/components/charts/LineChart";
import { toast } from "@/components/ui/Toast";

const ORDER_TYPES = ["MARKET", "LIMIT", "STOP_LOSS"] as const;
type OrderType = typeof ORDER_TYPES[number];

interface Quote {
  price: number; change: number; changePercent: number;
  high: number; low: number; open: number; prevClose: number;
  companyName?: string; exchange?: string; industry?: string;
}

interface Holding { symbol: string; quantity: number; avgBuyPrice: number; }

export default function TradePage() {
  const { token, user, updateUser } = useAuthStore();
  const { tradeSymbol, tradeCompany, setTradeStock } = useUIStore();

  const [tab, setTab] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [executing, setExecuting] = useState(false);
  const [flash, setFlash] = useState<"" | "green" | "red">("");
  const [aiAnalysis, setAiAnalysis] = useState("");

  const authHeader: Record<string, string> = {};

    if (token) {
      authHeader.Authorization = `Bearer ${token}`;
    }

  const fetchQuote = useCallback(async () => {
    if (!tradeSymbol) return;
    try {
      const res = await fetch(`/api/market/quote?symbol=${tradeSymbol}&type=quote`);
      const json = await res.json();
      if (json.success) setQuote(json.data);
    } catch { /* silent */ }
  }, [tradeSymbol]);

  const fetchCandles = useCallback(async () => {
    if (!tradeSymbol) return;
    try {
      const res = await fetch(`/api/market/quote?symbol=${tradeSymbol}&type=candles&resolution=D`);
      const json = await res.json();
      if (json.success && json.data.t) {
        const d = json.data;
        const labels = d.t.slice(-30).map((ts: number) =>
          new Date(ts * 1000).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })
        );
        setChartLabels(labels);
        setChartData(d.c.slice(-30));
      }
    } catch { /* silent */ }
  }, [tradeSymbol]);

  const fetchHolding = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/holdings", { headers: authHeader });
      const json = await res.json();
      if (json.success) {
        const h = json.data.find((x: Holding) => x.symbol === tradeSymbol);
        setHolding(h ?? null);
      }
    } catch { /* silent */ }
  }, [token, tradeSymbol]);

  useEffect(() => {
    fetchQuote();
    fetchCandles();
    fetchHolding();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [fetchQuote, fetchCandles, fetchHolding]);

  const price = orderType === "MARKET" ? (quote?.price ?? 0) : parseFloat(limitPrice) || 0;
  const total = price * qty;
  const cashAfter = (user?.cashBalance ?? 0) - (tab === "BUY" ? total : -total);

  async function executeTrade() {
    if (!token) { toast("Please login first", "error"); return; }
    if (qty < 1) { toast("Invalid quantity", "error"); return; }
    if (price <= 0) { toast("Invalid price", "error"); return; }
    if (tab === "BUY" && total > (user?.cashBalance ?? 0)) {
      toast(`Insufficient balance. Need ₹${total.toLocaleString("en-IN")}`, "error"); return;
    }
    if (tab === "SELL" && (!holding || holding.quantity < qty)) {
      toast("Insufficient holdings", "error"); return;
    }

    setExecuting(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: tradeSymbol, type: tab, orderType, quantity: qty,
          limitPrice: price, companyName: quote?.companyName ?? tradeCompany,
          exchange: quote?.exchange ?? "NSE", industry: quote?.industry ?? "Unknown",
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast(json.error ?? "Trade failed", "error"); return; }

      const { cashBalance, achievementsEarned } = json.data;
      updateUser({ cashBalance });
      setHolding(prev => {
        if (tab === "BUY") return { symbol: tradeSymbol, quantity: (prev?.quantity ?? 0) + qty, avgBuyPrice: price };
        const newQty = (prev?.quantity ?? 0) - qty;
        return newQty > 0 ? { ...prev!, quantity: newQty } : null;
      });

      setFlash(tab === "BUY" ? "green" : "red");
      setTimeout(() => setFlash(""), 800);

      if (json.data?.status === "PENDING") {
        toast(
          orderType === "STOP_LOSS"
            ? "✓ Stop Loss Order Placed"
            : "✓ Limit Order Placed",
           "info"
         );
       } else {
        toast(
          `✓ ${tab} ${qty} ${tradeSymbol} @ ₹${price.toLocaleString("en-IN")}`,
          tab === "BUY" ? "success" : "info"
          );
      }
      if (achievementsEarned?.length) {
        setTimeout(() => toast(`🏆 Achievement Unlocked: ${achievementsEarned[0]}!`, "success"), 600);
      }

      // Get AI analysis
      setAiAnalysis("Ghost AI is analyzing your trade...");
      try {
        const aiRes = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ message: `I just ${tab === "BUY" ? "bought" : "sold"} ${qty} shares of ${tradeSymbol} at ₹${price}. Give me a brief trade coaching analysis.` }),
        });
        const aiJson = await aiRes.json();
        if (aiJson.success) setAiAnalysis(aiJson.data.reply);
      } catch { setAiAnalysis("Trade executed! Review your portfolio for performance tracking."); }

      fetchHolding();
    } catch { toast("Trade execution failed", "error"); }
    finally { setExecuting(false); }
  }

  const changeUp = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="page-enter">
      <div className="flex items-center gap-2 px-6 pt-5 pb-0">
        <h1 className="font-head text-xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Trade</h1>
        <span className="text-sm font-mono" style={{ color: "var(--text3)", fontFamily: "Space Mono,monospace" }}>/ {tradeSymbol}</span>
      </div>

      <div className="grid gap-3 px-6 pt-4 pb-6" style={{ gridTemplateColumns: "1fr 300px" }}>
        {/* Left: Stock Detail */}
        <AnimatePresence>
          <motion.div
            key={tradeSymbol}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-[10px] border p-4 ${flash === "green" ? "flash-green" : flash === "red" ? "flash-red" : ""}`}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            {/* Stock hero */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-head text-2xl font-black" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>{tradeSymbol}</div>
                <div className="text-sm mt-0.5" style={{ color: "var(--text2)" }}>{quote?.companyName ?? tradeCompany} · {quote?.exchange ?? "NSE"}</div>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: "rgba(0,255,136,0.1)", color: "var(--accent)" }}>{quote?.industry ?? "EQUITY"}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold" style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>
                  {quote ? `₹${quote.price.toLocaleString("en-IN")}` : "Loading..."}
                </div>
                {quote && (
                  <div className="text-sm font-semibold mt-0.5" style={{ color: changeUp ? "var(--accent)" : "var(--red)" }}>
                    {changeUp ? "▲" : "▼"} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePercent).toFixed(2)}%)
                  </div>
                )}
                <div className="text-[10px] mt-1" style={{ color: "var(--text3)", fontFamily: "Space Mono,monospace" }}>
                  {new Date().toLocaleTimeString("en-IN")} · Live
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="rounded-lg overflow-hidden mb-4" style={{ background: "var(--bg2)", height: 200 }}>
              {chartData.length > 0
                ? <LineChart labels={chartLabels} data={chartData} height={200} />
                : <div className="flex items-center justify-center h-full text-xs" style={{ color: "var(--text3)" }}>Loading chart...</div>
              }
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { l: "DAY HIGH",  v: quote ? `₹${quote.high.toLocaleString("en-IN")}` : "—" },
                { l: "DAY LOW",   v: quote ? `₹${quote.low.toLocaleString("en-IN")}` : "—" },
                { l: "PREV CLOSE",v: quote ? `₹${quote.prevClose.toLocaleString("en-IN")}` : "—" },
                { l: "OPEN",      v: quote ? `₹${quote.open.toLocaleString("en-IN")}` : "—" },
              ].map(s => (
                <div key={s.l} className="rounded-md px-3 py-2" style={{ background: "var(--bg2)" }}>
                  <div className="text-[10px] tracking-[0.5px] mb-1" style={{ color: "var(--text3)" }}>{s.l}</div>
                  <div className="text-xs font-semibold font-mono" style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* AI Analysis */}
            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-3 border"
                style={{ background: "rgba(0,255,136,0.05)", borderColor: "rgba(0,255,136,0.15)" }}
              >
                <div className="text-[11px] font-bold mb-1.5 tracking-[0.5px]" style={{ color: "var(--accent)" }}>👻 GHOST AI ANALYSIS</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>{aiAnalysis}</div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Right: Order Panel */}
        <div className="rounded-[10px] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Place Order</div>

          {/* Buy/Sell tabs */}
          <div className="flex gap-1 mb-4 rounded-lg p-0.5" style={{ background: "var(--bg2)" }}>
            {(["BUY", "SELL"] as const).map(t => (
              <button
                key={t}
                onClick={() => {
                  if (orderType === "LIMIT" && t === "SELL") return;
                  if (orderType === "STOP_LOSS" && t === "BUY") return;

                  setTab(t);
                 }}
                className="flex-1 py-1.5 rounded-md text-xs font-bold transition-all"
                style={{
                  background: tab === t ? (t === "BUY" ? "rgba(0,255,136,0.2)" : "rgba(255,77,77,0.2)") : "transparent",
                  color: tab === t ? (t === "BUY" ? "var(--accent)" : "var(--red)") : "var(--text2)",
                  fontFamily: "Space Mono,monospace",
                }}
              >{t}</button>
            ))}
          </div>

          {/* Order type */}
          <div className="flex gap-1 mb-4">
            {ORDER_TYPES.map(ot => (
              <button
                key={ot}
                onClick={() => {
                  setOrderType(ot);

                  if (ot === "LIMIT") {
                    setTab("BUY");
                  }

                  if (ot === "STOP_LOSS") {
                    setTab("SELL");
                   }
                 }}
                className="flex-1 py-1.5 text-center rounded-md text-[10px] font-medium border transition-all"
                style={{
                  color: orderType === ot ? "var(--accent)" : "var(--text2)",
                  background: orderType === ot ? "rgba(0,255,136,0.08)" : "transparent",
                  borderColor: orderType === ot ? "rgba(0,255,136,0.2)" : "var(--border)",
                }}
              >{ot.replace("_", " ")}</button>
            ))}
          </div>

          {/* Quantity */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]" style={{ color: "var(--text2)" }}>Quantity (shares)</label>
            <input
              type="number" min={1} value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="gt-input font-mono"
              style={{ fontFamily: "Space Mono,monospace" }}
            />
          </div>

          {/* Limit price */}
          {orderType !== "MARKET" && (
            <div className="mb-3">
              <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]"style={{ color: "var(--text2)" }}>
                {orderType === "STOP_LOSS"
                 ? "Stop Loss Price (₹)"
                 : "Limit Price (₹)"}
               </label>
              <input
                type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                className="gt-input font-mono" placeholder={quote?.price.toString() ?? "0"}
                style={{ fontFamily: "Space Mono,monospace" }}
              />
            </div>
          )}

          {/* Order summary */}
          <div className="rounded-lg p-3 mb-3 flex flex-col gap-1.5" style={{ background: "var(--bg2)" }}>
            {[
              { l: "Price",         v: price > 0 ? `₹${price.toLocaleString("en-IN")}` : "—" },
              { l: "Quantity",      v: `${qty} shares` },
              { l: "Total Value",   v: price > 0 ? `₹${total.toLocaleString("en-IN")}` : "—" },
              { l: "Available Cash",v: `₹${(user?.cashBalance ?? 0).toLocaleString("en-IN")}`, accent: true },
            ].map(r => (
              <div key={r.l} className="flex justify-between text-xs">
                <span style={{ color: "var(--text2)" }}>{r.l}</span>
                <span className="font-mono" style={{ fontFamily: "Space Mono,monospace", color: r.accent ? "var(--accent)" : "var(--text)" }}>{r.v}</span>
              </div>
            ))}
            <div className="border-t pt-1.5 flex justify-between text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text)" }}>After Trade</span>
              <span className="font-mono" style={{ fontFamily: "Space Mono,monospace", color: cashAfter >= 0 ? "var(--accent)" : "var(--red)" }}>
                ₹{Math.abs(cashAfter).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Holdings info */}
          {holding && (
            <div className="rounded-lg px-3 py-2 mb-3 text-xs" style={{ background: "rgba(0,255,136,0.05)", borderColor: "rgba(0,255,136,0.15)", border: "1px solid" }}>
              <span style={{ color: "var(--text2)" }}>You hold </span>
              <span style={{ color: "var(--accent)", fontFamily: "Space Mono,monospace" }}>{holding.quantity} shares</span>
              <span style={{ color: "var(--text2)" }}> @ avg ₹{holding.avgBuyPrice.toLocaleString("en-IN")}</span>
            </div>
          )}

          {/* Execute button */}
          <motion.button
            onClick={executeTrade}
            disabled={executing || price <= 0}
            className="w-full py-2.5 rounded-lg font-bold text-sm transition-all"
            style={{
              background: tab === "BUY" ? "var(--accent)" : "#ff4d4d",
              color: tab === "BUY" ? "#000" : "#fff",
              fontFamily: "Syne,sans-serif",
              opacity: executing || price <= 0 ? 0.6 : 1,
            }}
            whileTap={{ scale: 0.97 }}
          >
            {
              executing
                ? "Executing..."
                : orderType === "STOP_LOSS"
                ? `SET STOP LOSS`
                : orderType === "LIMIT"
                ? `PLACE LIMIT ORDER`
                : `${tab} ${tradeSymbol}`
            }
          </motion.button>

          <p className="text-[10px] text-center mt-2.5" style={{ color: "var(--text3)" }}>
            Ghost AI will coach you after execution. No real money.
          </p>
        </div>
      </div>
    </div>
  );
}
