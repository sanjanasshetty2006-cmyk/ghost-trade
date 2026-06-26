"use client";
import { useEffect, useState } from "react";
import { useUIStore } from "@/store/useStore";
import SplashScreen from "@/components/ui/SplashScreen";
import Navbar from "@/components/layout/Navbar";
import HomePage from "@/components/pages/HomePage";
import ToastContainer from "@/components/ui/Toast";

export default function RootPage() {
  const { splashDone, setSplashDone } = useUIStore();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show splash only once per session
    const seen = sessionStorage.getItem("gt_splash");
    if (!seen && !splashDone) {
      setShowSplash(true);
    }
  }, [splashDone]);

  function onSplashComplete() {
    setShowSplash(false);
    setSplashDone();
    sessionStorage.setItem("gt_splash", "1");
  }

  if (showSplash) return <SplashScreen onComplete={onSplashComplete} />;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <ToastContainer />
      <Navbar />
      <HomePage />
    </div>
  );
}
