"use client";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "📈", title: "Live Paper Trading", desc: "Trade real NSE/BSE prices with ₹10L virtual cash. Market & limit orders supported.", page: "trade" },
  { icon: "🤖", title: "Ghost AI Coach",     desc: "Powered by Gemini 2.5 Flash. Portfolio analysis, risk reports, trade coaching.", page: "ai" },
  { icon: "🏆", title: "Competitions",       desc: "Daily, weekly & monthly challenges. College Battle Mode. Global leaderboards.",  page: "lb" },
  { icon: "🎓", title: "Learning Hub",       desc: "Beginner to advanced courses. Quizzes, XP system, badges & achievements.",      page: "learn" },
  { icon: "👻", title: "Ghost Mode",         desc: "Participate anonymously in leaderboards. Your identity, your choice.",          page: "lb" },
  { icon: "⏳", title: "Market Simulator",   desc: "Replay COVID crash, 2008 crisis, Dot-com bubble as if they were live.",        page: "market" },
];

const STATS = [
  { val: "2.4L+", lbl: "ACTIVE TRADERS", accent: true },
  { val: "₹840Cr+", lbl: "VIRTUAL VOLUME", accent: false },
  { val: "98.2%", lbl: "ACCURACY RATING", accent: true },
  { val: "4,800+", lbl: "STOCKS LISTED", accent: false },
  { val: "Gemini", lbl: "AI POWERED", accent: true },
];

export default function HomePage() {
  const { setPage } = useUIStore();
  const router = useRouter();

  function goTo(page: string) {
    setPage(page);
    router.push(`/dashboard?page=${page}`);
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative min-h-[480px] flex flex-col items-center justify-center text-center px-6 pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,136,0.06) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#1e1e1e 1px,transparent 1px),linear-gradient(90deg,#1e1e1e 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative inline-flex items-center gap-1.5 mb-6 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase"
          style={{ background: "rgba(0,255,136,0.08)", borderColor: "rgba(0,255,136,0.2)", color: "var(--accent)", fontFamily: "Space Mono, monospace" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 6px var(--accent)" }} />
          AI-Powered Paper Trading
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative font-black tracking-[-3px] leading-[0.9] mb-4"
          style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(52px,9vw,88px)", color: "var(--text)" }}
        >
          MASTER THE<br /><span style={{ color: "var(--accent)" }}>MARKET</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative text-base max-w-md leading-relaxed mb-8"
          style={{ color: "var(--text2)" }}
        >
          Practice. Learn. Analyze. Compete. Grow.<br />
          Trade with ₹10L virtual cash — zero risk, real skills.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative flex gap-3"
        >
          <motion.button
            onClick={() => router.push("/signup")}
            className="px-7 py-3 rounded-lg font-bold text-sm"
            style={{ background: "var(--accent)", color: "#000", fontFamily: "Syne, sans-serif" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Trading Free →
          </motion.button>
          <motion.button
            onClick={() => goTo("market")}
            className="px-7 py-3 rounded-lg font-medium text-sm border"
            style={{ background: "transparent", color: "var(--text)", borderColor: "var(--border)" }}
            whileHover={{ borderColor: "var(--text3)" }}
            whileTap={{ scale: 0.97 }}
          >
            Explore Markets
          </motion.button>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex mx-6 rounded-xl border overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {STATS.map((s, i) => (
          <div key={i} className="flex-1 py-4 text-center border-r last:border-r-0" style={{ borderColor: "var(--border)" }}>
            <div className="font-bold text-xl" style={{ fontFamily: "Syne, sans-serif", color: s.accent ? "var(--accent)" : "var(--text)" }}>{s.val}</div>
            <div className="text-[10px] mt-0.5 tracking-[0.5px]" style={{ color: "var(--text3)" }}>{s.lbl}</div>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 p-6">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            onClick={() => goTo(f.page)}
            className="rounded-xl border p-5 cursor-pointer transition-all duration-200"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
            whileHover={{ y: -2, borderColor: "rgba(0,255,136,0.3)" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-3 border" style={{ background: "rgba(0,255,136,0.1)", borderColor: "rgba(0,255,136,0.2)" }}>
              {f.icon}
            </div>
            <div className="font-bold text-sm mb-1.5" style={{ fontFamily: "Syne, sans-serif", color: "var(--text)" }}>{f.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>{f.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
