"use client";
import { motion } from "framer-motion";
import type { LeaderboardStats } from "@/types/leaderboard";

interface StatsCardsProps {
  stats: LeaderboardStats;
}

function fmt(n: number): string {
  if (n >= 1_00_00_000) return "₹" + (n / 1_00_00_000).toFixed(1) + "Cr";
  if (n >= 1_00_000)    return "₹" + (n / 1_00_000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Players",
      value: stats.totalPlayers.toLocaleString("en-IN"),
      icon:  "👥",
      color: "var(--accent)",
    },
    {
      label: "Highest Portfolio",
      value: fmt(stats.highestPortfolio),
      icon:  "🏆",
      color: "var(--yellow)",
    },
    {
      label: "Avg Return",
      value: (stats.averageReturn >= 0 ? "+" : "") + stats.averageReturn.toFixed(2) + "%",
      icon:  "📈",
      color: stats.averageReturn >= 0 ? "var(--accent)" : "var(--red)",
    },
    {
      label: "Highest XP",
      value: stats.highestXp.toLocaleString("en-IN"),
      icon:  "⚡",
      color: "#a855f7",
    },
    {
      label: "Today's Top Gainer",
      value: stats.todayTopGainer
        ? `${stats.todayTopGainer.name.split(" ")[0]} +${stats.todayTopGainer.returnsPercent.toFixed(2)}%`
        : "—",
      icon:  "🚀",
      color: "var(--accent)",
    },
    {
      label: "Today's Top Loser",
      value: stats.todayTopLoser
        ? `${stats.todayTopLoser.name.split(" ")[0]} ${stats.todayTopLoser.returnsPercent.toFixed(2)}%`
        : "—",
      icon:  "📉",
      color: "var(--red)",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 mb-5 lg:grid-cols-6">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-[10px] border p-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-base">{c.icon}</span>
            <span className="text-[10px]" style={{ color: "var(--text3)" }}>{c.label}</span>
          </div>
          <div
            className="text-sm font-bold truncate"
            style={{ color: c.color, fontFamily: "Space Mono,monospace" }}
          >
            {c.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}