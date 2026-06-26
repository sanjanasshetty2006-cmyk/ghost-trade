"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  changeUp?: boolean;
  accent?: boolean;
  red?: boolean;
  delay?: number;
}

export default function KpiCard({ label, value, change, changeUp, accent, red, delay = 0 }: KpiCardProps) {
  const [displayed, setDisplayed] = useState("—");
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setDisplayed(value), delay * 100 + 100);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [value, delay]);

  const color = accent ? "var(--accent)" : red ? "var(--red)" : "var(--text)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.08 }}
      className="rounded-[10px] p-4 border transition-all hover:border-[rgba(0,255,136,0.2)] hover:-translate-y-0.5"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="text-[11px] font-medium tracking-[0.5px] mb-1.5 uppercase" style={{ color: "var(--text3)" }}>
        {label}
      </div>
      <div
        className="font-head text-xl font-bold leading-none"
        style={{ fontFamily: "Syne, sans-serif", color }}
      >
        {displayed}
      </div>
      {change && (
        <div
          className="text-[11px] font-medium mt-1"
          style={{ color: changeUp ? "var(--accent)" : "var(--red)" }}
        >
          {changeUp ? "↑" : "↓"} {change}
        </div>
      )}
    </motion.div>
  );
}
