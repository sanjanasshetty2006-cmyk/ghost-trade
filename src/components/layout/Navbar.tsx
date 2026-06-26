"use client";
import Image from "next/image";
import { useAuthStore, useUIStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

const NAV_LINKS = [
  { id: "home",      label: "Home" },
  { id: "dashboard", label: "Dashboard" },
  { id: "market",    label: "Markets" },
  { id: "trade",     label: "Trade" },
  { id: "ai",        label: "Ghost AI" },
  { id: "lb",        label: "Leaderboard" },
  { id: "learn",     label: "Learn" },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { currentPage, setPage } = useUIStore();
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "GT";

  async function handleLogout() {
    await fetch("/api/auth/me", { method: "DELETE" });
    logout();
    toast("Logged out successfully", "info");
    router.push("/login");
  }

  function handleNav(id: string) {
    if (!user && !["home"].includes(id)) {
      router.push("/login");
      return;
    }
    setPage(id);
    if (id === "home") router.push("/");
    else router.push(`/dashboard?page=${id}`);
  }

  return (
    <nav
      className="flex items-center justify-between px-6 h-14 sticky top-0 z-50 border-b"
      style={{
        background: "rgba(0,0,0,0.95)",
        borderColor: "var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => handleNav("home")}
      >
        <Image src="/logo.png" alt="Ghost Trade" width={28} height={28} />
        <span
          className="text-lg font-black tracking-tight"
          style={{ fontFamily: "Syne, sans-serif", color: "var(--text)" }}
        >
          GHOST<span style={{ color: "var(--accent)" }}>TRADE</span>
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-0.5">
        {NAV_LINKS.map(link => (
          <button
            key={link.id}
            onClick={() => handleNav(link.id)}
            className="px-3 py-1.5 rounded-md text-[13px] font-normal transition-all duration-150"
            style={{
              color: currentPage === link.id ? "var(--accent)" : "var(--text2)",
              background: currentPage === link.id ? "var(--card)" : "transparent",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--accent)", color: "#000", fontFamily: "Space Mono, monospace" }}
            >
              LVL {user.level}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--accent), #0099ff)",
                color: "#000",
              }}
              title={user.name}
              onClick={() => handleNav("settings")}
            >
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="text-[12px] px-3 py-1.5 rounded-md border transition-all"
              style={{
                color: "var(--text2)",
                borderColor: "var(--border)",
                background: "transparent",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="text-[13px] px-3 py-1.5 rounded-md border transition-all"
              style={{ color: "var(--text2)", borderColor: "var(--border)" }}
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="text-[13px] px-3 py-1.5 rounded-md font-semibold transition-all"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
