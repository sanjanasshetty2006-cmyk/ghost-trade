"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useStore";
import type { LeaderboardUserProfile } from "@/types/leaderboard";

interface UserDrawerProps {
  userId:  string | null;
  onClose: () => void;
}

function fmt(n: number): string {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtSigned(n: number, isPercent = false): string {
  const sign = n >= 0 ? "+" : "−";
  return isPercent
    ? sign + Math.abs(n).toFixed(2) + "%"
    : sign + fmt(n);
}

export default function UserDrawer({ userId, onClose }: UserDrawerProps) {
  const { token }             = useAuthStore();
  const [profile, setProfile] = useState<LeaderboardUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    if (!userId) { setProfile(null); return; }
    setLoading(true);
    setError(null);

    fetch(`/api/leaderboard/${userId}`, { headers: authHeader })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data);
        else setError(json.error ?? "Failed to load profile");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {userId && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-full z-50 overflow-y-auto"
            style={{
              width: "min(420px, 100vw)",
              background: "var(--card)",
              borderLeft: "1px solid var(--border)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Drawer header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <h2 className="font-head font-bold text-base"
                style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>
                Trader Profile
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:opacity-70"
                style={{ background: "var(--bg2)", color: "var(--text2)" }}
              >
                ✕
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="p-5 flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--bg2)" }} />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="p-5 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm" style={{ color: "var(--text2)" }}>{error}</div>
              </div>
            )}

            {/* Profile content */}
            {!loading && profile && (
              <div className="p-5 flex flex-col gap-5">

                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2"
                    style={{
                      background:  `${profile.avatarColor}20`,
                      color:        profile.avatarColor,
                      borderColor:  profile.avatarColor,
                      boxShadow:   `0 0 20px ${profile.avatarColor}30`,
                    }}
                  >
                    {profile.initials}
                  </div>
                  <div>
                    <div className="font-head font-bold text-lg"
                      style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>
                      {profile.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                      {profile.college}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                        style={{ background: "rgba(0,255,136,0.1)", color: "var(--accent)", fontFamily: "Space Mono,monospace" }}>
                        LVL {profile.level}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text3)", fontFamily: "Space Mono,monospace" }}>
                        {profile.xp.toLocaleString()} XP
                      </span>
                      {profile.ghostMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.06)", color: "var(--text3)" }}>
                          👻 Ghost
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: "Portfolio Value", v: fmt(profile.portfolioValue),             c: "var(--text)"   },
                    { l: "Cash Balance",    v: fmt(profile.cashBalance),                c: "var(--accent)" },
                    { l: "Total P&L",       v: fmtSigned(profile.totalPnl),             c: profile.totalPnl >= 0 ? "var(--accent)" : "var(--red)" },
                    { l: "Returns",         v: fmtSigned(profile.returnsPercent, true), c: profile.returnsPercent >= 0 ? "var(--accent)" : "var(--red)" },
                    { l: "Total Trades",    v: String(profile.totalTrades),             c: "var(--text)"   },
                    { l: "Win Rate",        v: profile.winRate + "%",                   c: profile.winRate >= 50 ? "var(--accent)" : "var(--red)" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg p-3" style={{ background: "var(--bg2)" }}>
                      <div className="text-[10px] mb-1" style={{ color: "var(--text3)" }}>{s.l}</div>
                      <div className="text-sm font-bold font-mono" style={{ color: s.c, fontFamily: "Space Mono,monospace" }}>
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Achievements */}
                {profile.achievements.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-2"
                      style={{ color: "var(--text2)" }}>Achievements</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.achievements.map((a: string) => (
                        <span key={a} className="text-[10px] px-2 py-1 rounded-md border"
                          style={{ background: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.2)", color: "var(--yellow)" }}>
                          🏅 {a.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top holdings */}
                {profile.topHoldings.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-2"
                      style={{ color: "var(--text2)" }}>Top Holdings</div>
                    <div className="flex flex-col gap-1.5">
                      {profile.topHoldings.map((h) => (
                        <div key={h.symbol}
                          className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: "var(--bg2)" }}>
                          <div>
                            <div className="text-xs font-bold font-mono"
                              style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>{h.symbol}</div>
                            <div className="text-[10px]" style={{ color: "var(--text3)" }}>{h.companyName}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                              {fmt(h.currentValue)}
                            </div>
                            <div className="text-[10px] font-semibold"
                              style={{ color: h.pnl >= 0 ? "var(--accent)" : "var(--red)" }}>
                              {fmtSigned(h.pnl)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent trades */}
                {profile.recentTrades.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-2"
                      style={{ color: "var(--text2)" }}>Recent Trades</div>
                    <div className="flex flex-col gap-1.5">
                      {profile.recentTrades.map((t) => (
                        <div key={t._id}
                          className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: "var(--bg2)" }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                background: t.type === "BUY" ? "rgba(0,255,136,0.12)" : "rgba(255,77,77,0.12)",
                                color:      t.type === "BUY" ? "var(--accent)" : "var(--red)",
                                fontFamily: "Space Mono,monospace",
                              }}>
                              {t.type}
                            </span>
                            <span className="text-xs font-mono"
                              style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>
                              {t.symbol}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--text3)" }}>
                              ×{t.quantity}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs" style={{ color: "var(--text)" }}>
                              {fmt(t.price)}
                            </div>
                            <div className="text-[10px]" style={{ color: "var(--text3)" }}>
                              {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}