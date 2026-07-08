"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useUIStore } from "@/store/useStore";
import Navbar from "@/components/layout/Navbar";
import ToastContainer from "@/components/ui/Toast";
import DashboardPage from "@/components/pages/DashboardPage";
import MarketPage from "@/components/pages/MarketPage";
import TradePage from "@/components/pages/TradePage";
import AIPage from "@/components/pages/AIPage";
import LeaderboardPage from "@/components/pages/leaderboard/LeaderboardPage";
import LearnPage from "@/components/pages/LearnPage";
import SettingsPage from "@/components/pages/SettingsPage";

const PAGE_MAP: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  market: MarketPage,
  trade: TradePage,
  ai: AIPage,
  lb: LeaderboardPage,
  learn: LearnPage,
  settings: SettingsPage,
};

function DashboardContent() {
  const { user, token } = useAuthStore();
  const { currentPage, setPage } = useUIStore();

  const [hydrated, setHydrated] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Wait for Zustand persistence
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Sync URL param → store page
  useEffect(() => {
    const p = searchParams.get("page");

    if (p && PAGE_MAP[p]) {
      setPage(p);
    } else if (!PAGE_MAP[currentPage]) {
      setPage("dashboard");
    }
  }, [searchParams, setPage, currentPage]);

  // Redirect only after hydration
  useEffect(() => {
    if (!hydrated) return;

    if (!token || !user) {
      router.replace("/login");
    }
  }, [hydrated, token, user, router]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="text-sm animate-pulse"
          style={{ color: "var(--text2)" }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="text-sm"
          style={{ color: "var(--text2)" }}
        >
          Redirecting to login...
        </div>
      </div>
    );
  }

  const activePage =
    PAGE_MAP[currentPage] ? currentPage : "dashboard";

  const ActiveComponent = PAGE_MAP[activePage];

  return (
    <main>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ActiveComponent />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="text-sm animate-pulse"
        style={{ color: "var(--text2)" }}
      >
        Loading...
      </div>
    </div>
  );
}

export default function DashboardShell() {
  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
      }}
    >
      <ToastContainer />
      <Navbar />

      <Suspense fallback={<LoadingFallback />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}