"use client";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "@/types/leaderboard";

interface PodiumProps {
  top3:        LeaderboardEntry[];
  onUserClick: (userId: string) => void;
}

function fmt(n: number): string {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const PODIUM_CONFIG = [
  { rank: 2, medal: "🥈", color: "#c0c0c0", height: "h-24", order: "order-1", delay: 0.15 },
  { rank: 1, medal: "🥇", color: "#ffd700", height: "h-32", order: "order-2", delay: 0.05 },
  { rank: 3, medal: "🥉", color: "#cd7f32", height: "h-20", order: "order-3", delay: 0.25 },
];

export default function Podium({ top3, onUserClick }: PodiumProps) {
  return (
    <div className="flex items-end justify-center gap-3 mb-6 pt-4">
      {PODIUM_CONFIG.map((cfg) => {
        const entry = top3.find((e) => e.rank === cfg.rank);
        if (!entry) return null;

        return (
          <motion.div
            key={entry.userId}
            className={`flex flex-col items-center ${cfg.order} cursor-pointer`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cfg.delay, duration: 0.4 }}
            onClick={() => onUserClick(entry.userId)}
          >
            {/* Medal + Avatar */}
            <div className="text-2xl mb-1">{cfg.medal}</div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-2 border-2"
              style={{
                background: `${entry.avatarColor}20`,
                color:       entry.avatarColor,
                borderColor: cfg.color,
                boxShadow:   `0 0 16px ${cfg.color}40`,
              }}
            >
              {entry.initials}
            </div>

            {/* Name + college */}
            <div className="text-xs font-semibold text-center max-w-[80px] truncate mb-0.5"
              style={{ color: "var(--text)" }}>{entry.name}</div>
            <div className="text-[9px] text-center max-w-[80px] truncate mb-1"
              style={{ color: "var(--text3)" }}>{entry.college}</div>

            {/* Stats */}
            <div className="text-[11px] font-bold font-mono text-center mb-0.5"
              style={{ color: cfg.color, fontFamily: "Space Mono,monospace" }}>
              {fmt(entry.portfolioValue)}
            </div>
            <div className="text-[10px] font-mono text-center"
              style={{
                fontFamily: "Space Mono,monospace",
                color: entry.returnsPercent >= 0 ? "var(--accent)" : "var(--red)",
              }}>
              {entry.returnsPercent >= 0 ? "+" : ""}{entry.returnsPercent.toFixed(2)}%
            </div>

            {/* Podium base */}
            <div
              className={`mt-2 w-24 ${cfg.height} rounded-t-lg flex items-end justify-center pb-2`}
              style={{
                background:  `linear-gradient(to top, ${cfg.color}30, ${cfg.color}10)`,
                borderTop:   `2px solid ${cfg.color}60`,
                borderLeft:  `1px solid ${cfg.color}30`,
                borderRight: `1px solid ${cfg.color}30`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: cfg.color, fontFamily: "Space Mono,monospace" }}>
                #{cfg.rank}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}