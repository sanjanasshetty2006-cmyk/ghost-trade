"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let addToast: (msg: string, type?: Toast["type"]) => void = () => {};

export function toast(msg: string, type: Toast["type"] = "success") {
  addToast(msg, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToast = (message, type = "success") => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
  }, []);

  const colors = {
    success: { bg: "#00FF88", text: "#000" },
    error:   { bg: "#ff4d4d", text: "#fff" },
    info:    { bg: "#3b82f6", text: "#fff" },
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg cursor-pointer"
            style={{
              background: colors[t.type].bg,
              color: colors[t.type].text,
              fontFamily: "Space Mono, monospace",
              boxShadow: t.type === "success" ? "0 0 20px rgba(0,255,136,0.4)" : undefined,
            }}
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
