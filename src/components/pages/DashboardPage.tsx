"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuthStore, useUIStore } from "@/store/useStore";
import KpiCard from "@/components/ui/KpiCard";
import DoughnutChart from "@/components/charts/DoughnutChart";
import LineChart from "@/components/charts/LineChart";
import { toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Holding {
  _id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;   // always the live price returned by the API
  currentValue: number;
  totalInvested: number;
  pnl: number;
  pnlPercent: number;
}

interface PendingOrder {
  _id: string;
  symbol: string;
  type: "BUY" | "SELL";
  orderType: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  createdAt: string;
}

interface PortfolioData {
  holdings: Holding[];
  cashBalance: number;
  totalInvested: number;
  totalPortfolioValue: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  todayPnl: number;
  pnlPercent: number;
  portfolioScore: number;
  diversificationScore: number;
  riskScore: number;
  sectorAllocation: Record<string, number>;
  overallReturn: number;
  weeklyPnlHistory: Array<{ date: string; pnl: number }>;
  pendingOrders: PendingOrder[];
}

function fmt(n: number): string {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtSigned(n: number): string {
  return (n >= 0 ? "+" : "−") + fmt(n);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, token }            = useAuthStore();
  const { setPage, setTradeStock } = useUIStore();
  const [portfolio, setPortfolio]  = useState<PortfolioData | null>(null);
  const [loading, setLoading]      = useState(true);
  const router                     = useRouter();

  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchPortfolio = useCallback(async () => {
    try {
      const res  = await fetch("/api/portfolio", { headers: authHeader });
      const json = await res.json();
      if (json.success) setPortfolio(json.data);
    } catch {
      toast("Failed to load portfolio", "error");
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-sm animate-pulse" style={{ color: "var(--text2)" }}>
          Loading portfolio...
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const pnlUp   = (portfolio?.totalPnl   ?? 0) >= 0;
  const todayUp = (portfolio?.todayPnl   ?? 0) >= 0;
  const scoreVal = portfolio?.portfolioScore ?? 0;

  const sectorLabels = Object.keys(portfolio?.sectorAllocation ?? {});
  const sectorData   = Object.values(portfolio?.sectorAllocation ?? {}) as number[];

  // Only show sector chart when we have real categorised data (not all "Unknown"/"Other")
  const hasRealSectors = sectorLabels.length > 0 &&
    !(sectorLabels.length === 1 && (sectorLabels[0] === "Unknown" || sectorLabels[0] === "Other"));

  // Weekly chart — plot ALL available snapshots (no minimum threshold)
  const history      = portfolio?.weeklyPnlHistory ?? [];
  const chartLabels  = history.map((item) =>
    new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "2-digit" })
  );
  const chartData    = history.map((item) => item.pnl);
  const lastPnl      = chartData[chartData.length - 1] ?? 0;
  const chartColor   = lastPnl >= 0 ? "#00FF88" : "#ff4d4d";

  const holdings       = portfolio?.holdings     ?? [];
  const pendingOrders  = portfolio?.pendingOrders ?? [];
  const hasHoldings    = holdings.length > 0;

  // ── Navigate to Trade page passing live currentPrice ──────────────────────
  // currentPrice is the live price fetched by the API, NOT avgBuyPrice.
  // This ensures the Trade page opens with the real market price pre-filled.
  function goTrade(h: Holding) {
    setTradeStock(h.symbol, h.companyName, h.currentPrice);
    setPage("trade");
    router.push("/dashboard?page=trade");
  }

  return (
    <div className="page-enter">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-0">
        <div>
          <h1
            className="font-head text-xl font-bold"
            style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}
          >
            Portfolio Overview
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋 —{" "}
            {pnlUp ? "Your portfolio is up today" : "Markets are volatile today"}
          </p>
        </div>
        <div
          className="text-xs font-mono"
          style={{ color: "var(--text3)", fontFamily: "Space Mono,monospace" }}
        >
          {new Date()
            .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            .toUpperCase()}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2.5 px-6 py-4">
        <KpiCard
          label="PORTFOLIO VALUE"
          value={fmt(portfolio?.totalPortfolioValue ?? 0)}
          change={`${Math.abs(portfolio?.overallReturn ?? 0).toFixed(2)}% all time`}
          changeUp={pnlUp}
          delay={0}
        />
        <KpiCard
          label="AVAILABLE CASH"
          value={fmt(portfolio?.cashBalance ?? 0)}
          accent
          delay={1}
        />
        <KpiCard
          label="TODAY'S P&L"
          value={(todayUp ? "+" : "−") + fmt(portfolio?.todayPnl ?? 0)}
          change="Today"
          changeUp={todayUp}
          accent={todayUp}
          red={!todayUp}
          delay={2}
        />
        <KpiCard
          label="TOTAL P&L"
          value={(pnlUp ? "+" : "−") + fmt(portfolio?.totalPnl ?? 0)}
          change={`${Math.abs(portfolio?.pnlPercent ?? 0).toFixed(2)}%`}
          changeUp={pnlUp}
          accent={pnlUp}
          red={!pnlUp}
          delay={3}
        />
      </div>

      {/* ── Mid row: Chart + Holdings ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5 px-6 pb-6">

        {/* Weekly Total P&L Chart */}
        <div
          className="col-span-2 rounded-[10px] border p-4 h-[420px]"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3"
            style={{ color: "var(--text2)" }}
          >
            Weekly Total P&L
          </div>

          {chartData.length > 0 ? (
            <div style={{ height: 350, overflow: "hidden" }}>
              <LineChart
                labels={chartLabels}
                data={chartData}
                color={chartColor}
                formatY={(v) => fmtSigned(v)}
              />
            </div>
          ) : (
            // No snapshots yet — show helpful empty state
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-lg"
              style={{ height: 160, background: "var(--bg2)" }}
            >
              <div style={{ fontSize: 24 }}>📈</div>
              <div className="text-xs font-semibold" style={{ color: "var(--text2)" }}>
                Chart will appear after your first portfolio load
              </div>
              <div className="text-[11px] text-center" style={{ color: "var(--text3)" }}>
                Refresh the page once to save today's snapshot
              </div>
            </div>
          )}
        </div>

        {/* Top Holdings + Pending Orders */}
        <div
          className="rounded-[10px] border p-4 flex flex-col h-[420px]"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3"
            style={{ color: "var(--text2)" }}
          >
            Top Holdings
          </div>
          <div className="flex-1 overflow-y-auto pr-1">

          {!hasHoldings ? (
            <div className="text-xs py-8 text-center" style={{ color: "var(--text3)" }}>
              No holdings yet.<br />Start trading to build your portfolio!
            </div>
          ) : (
            <div className="flex flex-col">
              {holdings.slice(0, 5).map((h: Holding) => (
                <div
                  key={h._id}
                  className="flex items-center gap-2 py-2 border-b last:border-b-0 cursor-pointer hover:opacity-80"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  onClick={() => goTrade(h)}
                >
                  <div
                    className="text-xs font-bold font-mono min-w-[52px]"
                    style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}
                  >
                    {h.symbol}
                  </div>
                  <div
                    className="text-[11px] flex-1 truncate"
                    style={{ color: "var(--text2)" }}
                  >
                    {h.companyName}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      {fmt(h.currentValue)}
                    </div>
                    <div
                      className="text-[10px] font-semibold"
                      style={{ color: h.pnl >= 0 ? "var(--accent)" : "var(--red)" }}
                    >
                      P&L: {fmtSigned(h.pnl)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Orders — shown below holdings when any exist */}
          {pendingOrders.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.5px] mb-2"
                style={{ color: "var(--text3)" }}
              >
                Pending Orders
              </div>
              <div className="flex flex-col gap-1">
                {pendingOrders.map((o: PendingOrder) => (
                  <div
                    key={o._id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5"
                    style={{ background: "var(--bg2)" }}
                  >
                    <div>
                      <span
                        className="text-[11px] font-bold font-mono"
                        style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}
                      >
                        {o.symbol}
                      </span>
                      <span className="text-[10px] ml-1.5" style={{ color: "var(--text3)" }}>
                        {o.quantity} share{o.quantity > 1 ? "s" : ""} @ {fmt(o.price)}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          o.orderType === "STOP_LOSS"
                            ? "rgba(255,77,77,0.15)"
                            : "rgba(255,215,0,0.15)",

                        color:
                          o.orderType === "STOP_LOSS"
                            ? "var(--red)"
                            : "var(--yellow)",

                        fontFamily: "Space Mono,monospace",
                      }}
                    >
                      {o.orderType === "STOP_LOSS"
                        ? "STOP LOSS"
                        : "LIMIT"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>

        </div>

      </div>

      {/* ── Bottom row: Sector + Score + Competitions ───────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5 px-6 pb-6">

        {/* Sector Allocation */}
        <div
          className="rounded-[10px] border p-4 h-[220px]"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
         >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3"
            style={{ color: "var(--text2)" }}
          >
            Sector Allocation
          </div>

          {hasRealSectors ? (
            <>
              <DoughnutChart labels={sectorLabels} data={sectorData} height={120} />
              <div
                className="grid grid-cols-2 gap-1 mt-3 overflow-y-auto"
               style={{ maxHeight: 70 }}
              >
  {sectorLabels.map((s, i) => {
                  const colors = ["#00FF88","#3b82f6","#ffd700","#ff6b35","#a855f7","#ec4899","#14b8a6","#ef4444","#8b5cf6","#f97316",];
                  return (
                    <div
                      key={s}
                      className="flex items-center gap-1.5 text-[10px]"
                      style={{ color: "var(--text2)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{
                          background: colors[i % colors.length]
                        }}
                      />
                      <span className="truncate">{s}</span>
                      <span
                        className="ml-auto font-mono text-[10px]"
                        style={{ color: "var(--text)" }}
                      >
                        {sectorData[i]}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-xs py-2 text-center" style={{ color: "var(--text3)" }}>
              {hasHoldings
                ? "Sector data unavailable for your holdings"
                : "No holdings to show allocation"}
            </div>
          )}
        </div>

        {/* Portfolio Score */}
        <div
          className="rounded-[10px] border p-4 flex flex-col items-center"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3 w-full"
            style={{ color: "var(--text2)" }}
          >
            Portfolio Score
          </div>

          <div className="relative w-24 h-24 mb-3">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18" cy="18" r="15.9"
                fill="none" stroke="#1e1e1e" strokeWidth="3"
              />
              <motion.circle
                cx="18" cy="18" r="15.9"
                fill="none" stroke="#00FF88" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${scoreVal} 100`}
                initial={{ strokeDasharray: "0 100" }}
                animate={{ strokeDasharray: `${scoreVal} 100` }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ filter: "drop-shadow(0 0 4px rgba(0,255,136,0.6))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="font-head text-2xl font-black"
                style={{ fontFamily: "Syne,sans-serif", color: "var(--accent)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {scoreVal}
              </motion.span>
              <span className="text-[9px]" style={{ color: "var(--text3)" }}>/100</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-1.5">
            {[
              { l: "Diversity", v: portfolio?.diversificationScore ?? 0, c: "var(--accent)" },
              { l: "Risk",      v: portfolio?.riskScore ?? 0,            c: "var(--yellow)" },
            ].map((item) => (
              <div
                key={item.l}
                className="rounded-md px-2 py-1.5 text-center"
                style={{ background: "var(--bg2)" }}
              >
                <div className="text-[10px]" style={{ color: "var(--text2)" }}>{item.l}</div>
                <div
                  className="text-xs font-bold mt-0.5"
                  style={{ color: item.c, fontFamily: "Space Mono,monospace" }}
                >
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Competitions */}
        <div
          className="rounded-[10px] border p-4 h-[220px]"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3"
            style={{ color: "var(--text2)" }}
          >
            Active Competitions
          </div>

          <div className="flex flex-col gap-2">
            {(portfolio?.holdings?.length ?? 0) === 0 ? (
              <div className="rounded-md p-4 text-center" style={{ background: "var(--bg2)" }}>
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Not Ranked Yet
                </div>
                <div className="text-[11px]" style={{ color: "var(--text3)" }}>
                  Complete your first trade to join competitions and appear on the leaderboard.
                </div>
              </div>
            ) : (
              <div className="rounded-md p-4 text-center" style={{ background: "var(--bg2)" }}>
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Competition Active
                </div>
                <div className="text-[11px]" style={{ color: "var(--text3)" }}>
                  Rankings will appear automatically as your portfolio performance is tracked.
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setPage("ai");
                router.push("/dashboard?page=ai");
              }}
              className="w-full py-2 rounded-md border text-xs font-semibold mt-1 transition-all hover:opacity-80"
              style={{
                background:  "rgba(0,255,136,0.08)",
                borderColor: "rgba(0,255,136,0.2)",
                color:       "var(--accent)",
              }}
            >
              Get AI Portfolio Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}