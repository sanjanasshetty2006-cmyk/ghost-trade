"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useStore";
import { toast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { user, token, updateUser } = useAuthStore();
  const [name, setName]             = useState(user?.name ?? "");
  const [college, setCollege]       = useState(user?.college ?? "");
  const [ghostMode, setGhostMode]   = useState(user?.ghostMode ?? false);
  const [saving, setSaving]         = useState(false);
  const authHeader: Record<string, string> = {};

    if (token) {
       authHeader.Authorization = `Bearer ${token}`;


  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name, college, ghostMode }),
      });
      const json = await res.json();
      if (json.success) { updateUser(json.data); toast("Settings saved ✓"); }
      else toast(json.error ?? "Save failed", "error");
    } catch { toast("Connection error", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="page-enter px-6 py-5 max-w-xl">
      <div className="mb-5">
        <h1 className="font-head text-xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[10px] border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Profile</div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: "linear-gradient(135deg,var(--accent),#0099ff)", color: "#000" }}>
            {name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "GT"}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{user?.name}</div>
            <div className="text-xs" style={{ color: "var(--text2)" }}>{user?.email}</div>
            <div className="text-[11px] mt-1 font-mono" style={{ color: "var(--accent)", fontFamily: "Space Mono,monospace" }}>
              Level {user?.level} · {user?.xp?.toLocaleString()} XP
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]" style={{ color: "var(--text2)" }}>Full Name</label>
            <input className="gt-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]" style={{ color: "var(--text2)" }}>Email</label>
            <input className="gt-input" value={user?.email ?? ""} disabled style={{ opacity: 0.5 }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]" style={{ color: "var(--text2)" }}>College</label>
            <input className="gt-input" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. IIT Bombay" />
          </div>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-[10px] border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Preferences</div>

        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>Ghost Mode 👻</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>Hide your identity on the leaderboard</div>
          </div>
          <button
            onClick={() => setGhostMode(g => !g)}
            className="relative w-11 h-6 rounded-full transition-all"
            style={{ background: ghostMode ? "var(--accent)" : "var(--border)" }}
          >
            <div className="absolute top-0.5 transition-all w-5 h-5 rounded-full"
              style={{ background: "#fff", left: ghostMode ? "calc(100% - 22px)" : "2px" }} />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>Account Balance</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>Your current virtual cash</div>
          </div>
          <div className="font-mono font-bold" style={{ color: "var(--accent)", fontFamily: "Space Mono,monospace" }}>
            ₹{(user?.cashBalance ?? 0).toLocaleString("en-IN")}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-[10px] border p-5 mb-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Your Stats</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Total Trades", v: user?.totalTrades ?? 0 },
            { l: "XP Earned",    v: (user?.xp ?? 0).toLocaleString() },
            { l: "Day Streak",   v: `${user?.streak ?? 0} 🔥` },
          ].map(s => (
            <div key={s.l} className="rounded-lg p-3 text-center" style={{ background: "var(--bg2)" }}>
              <div className="font-head text-lg font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--accent)" }}>{s.v}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text3)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.button
        onClick={save}
        disabled={saving}
        className="w-full py-2.5 rounded-lg font-bold text-sm"
        style={{ background: "var(--accent)", color: "#000", fontFamily: "Syne,sans-serif", opacity: saving ? 0.7 : 1 }}
        whileTap={{ scale: 0.98 }}
      >
        {saving ? "Saving..." : "Save Changes"}
      </motion.button>
    </div>
  );
}
