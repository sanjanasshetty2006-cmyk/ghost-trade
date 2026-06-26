"use client";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useStore";

const COURSES = [
  { level: "BEGINNER", title: "Stock Market Basics",          meta: "8 lessons · 45 min",   progress: 100, color: "var(--accent)",  bg: "rgba(0,255,136,0.1)" },
  { level: "BEGINNER", title: "Reading Candlestick Charts",   meta: "12 lessons · 1.5 hr",  progress: 75,  color: "var(--accent)",  bg: "rgba(0,255,136,0.1)" },
  { level: "INTERMEDIATE", title: "Technical Analysis Mastery",meta: "20 lessons · 3 hr",   progress: 30,  color: "var(--yellow)", bg: "rgba(255,215,0,0.1)" },
  { level: "INTERMEDIATE", title: "Fundamental Analysis",     meta: "15 lessons · 2.5 hr",  progress: 0,   color: "var(--yellow)", bg: "rgba(255,215,0,0.1)" },
  { level: "ADVANCED",     title: "Options & Derivatives",    meta: "24 lessons · 5 hr",    progress: 0,   color: "var(--blue)",   bg: "rgba(59,130,246,0.1)", locked: true, lockLevel: 15 },
  { level: "ADVANCED",     title: "Algorithmic Trading",      meta: "18 lessons · 4 hr",    progress: 0,   color: "var(--blue)",   bg: "rgba(59,130,246,0.1)", locked: true, lockLevel: 20 },
];

const BADGES = [
  { icon: "🎯", title: "First Trade",    xp: 100,   earned: true  },
  { icon: "📈", title: "First Profit",   xp: 200,   earned: true  },
  { icon: "🔥", title: "10 Trades",      xp: 500,   earned: true  },
  { icon: "💎", title: "100 Trades",     xp: 2000,  earned: false },
  { icon: "🚀", title: "Portfolio 2x",   xp: 5000,  earned: false },
  { icon: "👑", title: "Market Expert",  xp: 10000, earned: false },
  { icon: "🤖", title: "AI Master",      xp: 3000,  earned: false },
  { icon: "🏆", title: "Competition Win",xp: 1500,  earned: false },
];

const CONCEPTS = [
  { q: "What is P/E Ratio?",          a: "Price-to-Earnings ratio measures how much investors pay per ₹1 of earnings. Lower P/E vs peers = potentially undervalued." },
  { q: "What is Market Capitalization?",a: "Total market value of a company's shares. Large-cap > ₹20,000Cr, Mid-cap ₹5,000-20,000Cr, Small-cap < ₹5,000Cr." },
  { q: "What is Diversification?",    a: "Spreading investments across sectors/assets to reduce risk. If one sector falls, others cushion the impact." },
  { q: "What is Stop Loss?",          a: "A pre-set price to automatically sell a stock if it falls, limiting your maximum loss on a position." },
];

export default function LearnPage() {
  const { user } = useAuthStore();
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const nextLevelXp = level * 500;
  const progress = Math.min((xp % 500) / 500 * 100, 100);

  return (
    <div className="page-enter px-6 py-5">
      <div className="mb-5">
        <h1 className="font-head text-xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Learning Hub</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>Level up your trading knowledge</p>
      </div>

      {/* XP Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-[10px] border px-5 py-4 mb-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <motion.div
          className="font-head text-4xl font-black min-w-[56px] text-center"
          style={{ fontFamily: "Syne,sans-serif", color: "var(--accent)" }}
          initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          {level}
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
            {level < 5 ? "Market Apprentice" : level < 10 ? "Intermediate Trader" : level < 15 ? "Advanced Analyst" : "Market Expert"} · {xp.toLocaleString()} XP
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg2)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,136,0.5)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--text3)", fontFamily: "Space Mono,monospace" }}>
            {xp % 500} / 500 XP to Level {level + 1}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] mb-1" style={{ color: "var(--text3)" }}>STREAK</div>
          <div className="font-head text-2xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--yellow)" }}>🔥 {user?.streak ?? 0}</div>
          <div className="text-[10px]" style={{ color: "var(--text3)" }}>days</div>
        </div>
      </motion.div>

      {/* Courses */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {COURSES.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-[10px] border p-4 cursor-pointer transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)", opacity: c.locked ? 0.5 : 1 }}
            whileHover={!c.locked ? { y: -2, borderColor: "rgba(0,255,136,0.3)" } : {}}
          >
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-3"
              style={{ background: c.bg, color: c.color }}>
              {c.level}
            </span>
            <div className="text-sm font-bold mb-1.5 leading-snug" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>{c.title}</div>
            <div className="text-[11px] mb-3" style={{ color: "var(--text3)" }}>{c.meta}</div>
            {c.locked ? (
              <div className="text-[10px]" style={{ color: "var(--text3)" }}>🔒 Locked — Level {c.lockLevel}</div>
            ) : (
              <>
                <div className="h-0.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--bg2)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.progress === 100 ? "var(--accent)" : c.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.07 }}
                  />
                </div>
                <div className="text-[10px]" style={{ color: c.progress === 100 ? "var(--accent)" : "var(--text3)" }}>
                  {c.progress === 100 ? "✓ COMPLETED" : `${c.progress}% complete`}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div className="rounded-[10px] border p-4 mb-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3" style={{ color: "var(--text2)" }}>Achievements</div>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: b.earned ? 1 : 0.45, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ background: "var(--bg2)", borderColor: b.earned ? "rgba(255,215,0,0.3)" : "var(--border)" }}
            >
              <span className="text-lg">{b.icon}</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: b.earned ? "var(--text)" : "var(--text2)" }}>{b.title}</div>
                <div className="text-[10px]" style={{ color: "var(--text3)", fontFamily: "Space Mono,monospace" }}>+{b.xp.toLocaleString()} XP</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Concepts */}
      <div className="rounded-[10px] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3" style={{ color: "var(--text2)" }}>Key Concepts</div>
        <div className="grid grid-cols-2 gap-2">
          {CONCEPTS.map((c, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: "var(--bg2)" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>{c.q}</div>
              <div className="text-[11px] leading-relaxed" style={{ color: "var(--text2)" }}>{c.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
