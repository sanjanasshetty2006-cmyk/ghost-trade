"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=done

  useEffect(() => {
    // Progress bar
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 40);

    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onComplete(), 2800);

    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  // Candlestick bars for animation
  const candles = [
    { h: 55, bull: true  },
    { h: 35, bull: false },
    { h: 70, bull: true  },
    { h: 45, bull: false },
    { h: 80, bull: true  },
    { h: 60, bull: true  },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: "#000" }}
        exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(#1e1e1e 1px,transparent 1px),linear-gradient(90deg,#1e1e1e 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,255,136,0.08) 0%, transparent 70%)" }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo + Candles Row */}
        <div className="relative flex items-center justify-center gap-6 mb-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: "drop-shadow(0 0 30px rgba(0,255,136,0.8)) drop-shadow(0 0 60px rgba(0,255,136,0.3))",
            }}
          >
            <motion.div
              animate={{ filter: ["drop-shadow(0 0 20px rgba(0,255,136,0.6))", "drop-shadow(0 0 50px rgba(0,255,136,1))", "drop-shadow(0 0 20px rgba(0,255,136,0.6))"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image src="/logo.png" alt="Ghost Trade" width={110} height={110} priority />
            </motion.div>
          </motion.div>

          {/* Animated Candlesticks */}
          <motion.div
            className="flex items-end gap-1.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {candles.map((c, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-0.5"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.35, ease: "backOut" }}
                style={{ transformOrigin: "bottom" }}
              >
                {/* Wick top */}
                <div style={{ width: 1, height: c.h * 0.15, background: c.bull ? "#00FF88" : "#ff4d4d" }} />
                {/* Body */}
                <div
                  style={{
                    width: 8,
                    height: c.h * 0.6,
                    background: c.bull ? "#00FF88" : "#ff4d4d",
                    borderRadius: 2,
                    boxShadow: c.bull ? "0 0 6px rgba(0,255,136,0.6)" : "0 0 6px rgba(255,77,77,0.4)",
                  }}
                />
                {/* Wick bottom */}
                <div style={{ width: 1, height: c.h * 0.15, background: c.bull ? "#00FF88" : "#ff4d4d" }} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Brand text */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.h1
                className="font-head text-5xl font-black tracking-[-3px] text-white mb-2"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                GHOST<span style={{ color: "#00FF88" }}>TRADE</span>
              </motion.h1>
              <motion.p
                className="text-sm font-mono tracking-[4px] uppercase"
                style={{ color: "#00FF88", fontFamily: "Space Mono, monospace" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                MASTER THE MARKET
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-12 w-48"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full h-px bg-[#1e1e1e] rounded overflow-hidden">
            <motion.div
              className="h-full rounded"
              style={{ background: "#00FF88", boxShadow: "0 0 8px rgba(0,255,136,0.8)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <div className="text-center mt-2 text-[10px] font-mono" style={{ color: "#555", fontFamily: "Space Mono, monospace" }}>
            INITIALIZING...
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
