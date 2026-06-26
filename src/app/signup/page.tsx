"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, useUIStore } from "@/store/useStore";
import { toast } from "@/components/ui/Toast";
import ToastContainer from "@/components/ui/Toast";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", college: "" });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { setPage } = useUIStore();
  const router = useRouter();

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { toast(json.error ?? "Signup failed", "error"); return; }
      setAuth(json.data.user, json.data.token);
      setPage("dashboard");
      toast("Welcome to Ghost Trade! ₹10L added to your account 🎉", "success");
      router.push("/dashboard");
    } catch {
      toast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <ToastContainer />
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "linear-gradient(#1e1e1e 1px,transparent 1px),linear-gradient(90deg,#1e1e1e 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,255,136,0.06) 0%, transparent 70%)" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative w-full max-w-sm mx-4">
        <div className="flex flex-col items-center mb-8">
          <motion.div animate={{ filter: ["drop-shadow(0 0 15px rgba(0,255,136,0.4))", "drop-shadow(0 0 30px rgba(0,255,136,0.8))", "drop-shadow(0 0 15px rgba(0,255,136,0.4))"] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <Image src="/logo.png" alt="Ghost Trade" width={56} height={56} />
          </motion.div>
          <h1 className="mt-3 text-2xl font-black tracking-tight" style={{ fontFamily: "Syne, sans-serif", color: "var(--text)" }}>
            GHOST<span style={{ color: "var(--accent)" }}>TRADE</span>
          </h1>
          <p className="text-xs mt-1 tracking-[3px] uppercase" style={{ color: "var(--accent)", fontFamily: "Space Mono, monospace" }}>START YOUR JOURNEY</p>
        </div>

        <div className="rounded-xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "Syne, sans-serif", color: "var(--text)" }}>Create account</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text2)" }}>Get ₹10,00,000 virtual cash instantly</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {[
              { key: "name",     label: "Full Name",    type: "text",     placeholder: "Arjun Sharma" },
              { key: "email",    label: "Email",        type: "email",    placeholder: "you@example.com" },
              { key: "password", label: "Password",     type: "password", placeholder: "Min 6 characters" },
              { key: "college",  label: "College (optional)", type: "text", placeholder: "IIT Bombay" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]" style={{ color: "var(--text2)" }}>{f.label}</label>
                <input className="gt-input" type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={update(f.key)} required={f.key !== "college"} />
              </div>
            ))}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-bold text-sm mt-2"
              style={{ background: "var(--accent)", color: "#000", fontFamily: "Syne, sans-serif", opacity: loading ? 0.7 : 1 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Creating account..." : "Start Trading Free →"}
            </motion.button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: "var(--text2)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
