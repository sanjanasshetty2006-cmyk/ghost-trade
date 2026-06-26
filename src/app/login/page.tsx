"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore, useUIStore } from "@/store/useStore";
import { toast } from "@/components/ui/Toast";
import ToastContainer from "@/components/ui/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const { setPage } = useUIStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast(json.error ?? "Login failed", "error");
        return;
      }

      setAuth(json.data.user, json.data.token);
      setPage("dashboard");

      toast("Welcome back! 👻", "success");

      router.push("/dashboard");
    } catch {
      toast("Connection error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <ToastContainer />

      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(#1e1e1e 1px,transparent 1px),linear-gradient(90deg,#1e1e1e 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,255,136,0.06) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{
              filter: [
                "drop-shadow(0 0 15px rgba(0,255,136,0.4))",
                "drop-shadow(0 0 30px rgba(0,255,136,0.8))",
                "drop-shadow(0 0 15px rgba(0,255,136,0.4))",
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
          >
            <Image
              src="/logo.png"
              alt="Ghost Trade"
              width={56}
              height={56}
            />
          </motion.div>

          <h1
            className="mt-3 text-2xl font-black tracking-tight"
            style={{
              fontFamily: "Syne, sans-serif",
              color: "var(--text)",
            }}
          >
            GHOST
            <span style={{ color: "var(--accent)" }}>
              TRADE
            </span>
          </h1>

          <p
            className="text-xs mt-1 tracking-[3px] uppercase"
            style={{
              color: "var(--accent)",
              fontFamily: "Space Mono, monospace",
            }}
          >
            MASTER THE MARKET
          </p>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="text-lg font-bold mb-1"
            style={{
              fontFamily: "Syne, sans-serif",
              color: "var(--text)",
            }}
          >
            Welcome back
          </h2>

          <p
            className="text-sm mb-6"
            style={{
              color: "var(--text2)",
            }}
          >
            Login to your trading account
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div>
              <label
                className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]"
                style={{
                  color: "var(--text2)",
                }}
              >
                Email
              </label>

              <input
                className="gt-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-medium mb-1.5 uppercase tracking-[0.5px]"
                style={{
                  color: "var(--text2)",
                }}
              >
                Password
              </label>

              <div className="relative">
                <input
                  className="gt-input pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{
                    color: "var(--text2)",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-bold text-sm mt-1"
              style={{
                background: "var(--accent)",
                color: "#000",
                fontFamily: "Syne, sans-serif",
                opacity: loading ? 0.7 : 1,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              {loading ? "Logging in..." : "Login →"}
            </motion.button>
          </form>

          <p
            className="text-center text-sm mt-4"
            style={{
              color: "var(--text2)",
            }}
          >
            No account?{" "}
            <Link
              href="/signup"
              className="font-semibold"
              style={{
                color: "var(--accent)",
              }}
            >
              Sign up free
            </Link>
          </p>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{
            color: "var(--text3)",
          }}
        >
          New users receive ₹10,00,000 virtual cash
        </p>
      </motion.div>
    </div>
  );
}