"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useStore";
import { useAIStore } from "@/store/useStore";
import { toast } from "@/components/ui/Toast";

const QUICK_PROMPTS = [
  "Analyze my portfolio weaknesses",
  "Which sector should I diversify into?",
  "Explain PE ratio and how to use it",
  "Should I hold or sell my top position?",
  "Give me my weekly trading review",
  "What is dollar cost averaging?",
];

const REPORT_TYPES = [
  { type: "health",          label: "Portfolio Health Report" },
  { type: "weekly",          label: "Weekly Review" },
  { type: "risk",            label: "Risk Analysis" },
  { type: "diversification", label: "Diversification Report" },
];

export default function AIPage() {
  const { token } = useAuthStore();
  const { messages, isTyping, addMessage, setTyping, clearMessages } = useAIStore();
  const [input, setInput] = useState("");
  const [loadingReport, setLoadingReport] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  function scrollBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    if (!token) { toast("Please login to use Ghost AI", "error"); return; }

    addMessage({ role: "user", content: text, timestamp: new Date() });
    setInput("");
    setTyping(true);
    scrollBottom();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      addMessage({ role: "ai", content: json.success ? json.data.reply : "I'm having trouble right now. Please try again!", timestamp: new Date() });
    } catch {
      addMessage({ role: "ai", content: "Connection error. Please check your internet and try again.", timestamp: new Date() });
    } finally {
      setTyping(false);
      scrollBottom();
    }
  }

  async function generateReport(type: string, label: string) {
    if (!token) { toast("Please login first", "error"); return; }
    setLoadingReport(type);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: type }),
      });
      const json = await res.json();
      if (json.success) {
        addMessage({ role: "user", content: `Generate my ${label}`, timestamp: new Date() });
        addMessage({ role: "ai", content: json.data.report, timestamp: new Date() });
        scrollBottom();
      }
    } catch { toast("Failed to generate report", "error"); }
    finally { setLoadingReport(""); }
  }

  return (
    <div className="page-enter">
      <div className="flex items-center gap-3 px-6 pt-5 pb-3">
        <h1 className="font-head text-xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Ghost AI</h1>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: "var(--accent)", fontFamily: "Space Mono,monospace" }}>
          ● ONLINE
        </span>
        <button onClick={clearMessages} className="ml-auto text-xs px-3 py-1.5 rounded-md border" style={{ color: "var(--text2)", borderColor: "var(--border)" }}>
          Clear Chat
        </button>
      </div>

      <div className="grid gap-3 px-6 pb-6" style={{ gridTemplateColumns: "1fr 320px", height: "calc(100vh - 160px)", minHeight: 480 }}>
        {/* Chat */}
        <div className="rounded-[10px] border flex flex-col overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base ai-pulse"
              style={{ background: "linear-gradient(135deg,var(--accent),#0099ff)" }}
              animate={{ boxShadow: ["0 0 0 0 rgba(0,255,136,0.4)", "0 0 0 8px rgba(0,255,136,0)", "0 0 0 0 rgba(0,255,136,0.4)"] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              👻
            </motion.div>
            <div>
              <div className="text-sm font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Ghost AI</div>
              <div className="text-[11px]" style={{ color: "var(--accent)" }}>Powered by Gemini · Portfolio connected</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.role === "ai" ? "self-start" : "self-end"}`}
                  style={{
                    background: msg.role === "ai" ? "var(--bg2)" : "rgba(0,255,136,0.12)",
                    border: `1px solid ${msg.role === "ai" ? "var(--border)" : "rgba(0,255,136,0.2)"}`,
                    borderRadius: msg.role === "ai" ? "10px 10px 10px 2px" : "10px 10px 2px 10px",
                    color: "var(--text)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div className="text-[10px] font-bold mb-1 tracking-[0.5px]" style={{ color: msg.role === "ai" ? "var(--accent)" : "var(--text2)" }}>
                    {msg.role === "ai" ? "GHOST AI" : "YOU"}
                  </div>
                  {msg.content}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="self-start flex items-center gap-1.5 px-4 py-3 rounded-xl border"
                  style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
                >
                  {[0,1,2].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full typing-dot`} style={{ background: "var(--accent)" }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t" style={{ borderColor: "var(--border)" }}>
            <input
              className="flex-1 rounded-lg px-3 py-2 text-xs outline-none border"
              style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)", fontFamily: "DM Sans,sans-serif" }}
              placeholder="Ask Ghost AI anything about markets, stocks, your portfolio..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            />
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              className="px-3 py-2 rounded-lg text-xs font-bold"
              style={{ background: "var(--accent)", color: "#000", fontFamily: "Space Mono,monospace", opacity: isTyping || !input.trim() ? 0.5 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              SEND
            </motion.button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Quick prompts */}
          <div className="rounded-[10px] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3" style={{ color: "var(--text2)" }}>Quick Prompts</div>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left text-xs px-3 py-2 rounded-md border transition-all"
                  style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text2)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,136,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Reports */}
          <div className="rounded-[10px] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3" style={{ color: "var(--text2)" }}>AI Reports</div>
            <div className="flex flex-col gap-2">
              {REPORT_TYPES.map(r => (
                <button
                  key={r.type}
                  onClick={() => generateReport(r.type, r.label)}
                  disabled={loadingReport === r.type}
                  className="w-full py-2 px-3 rounded-md border text-xs font-semibold text-left transition-all"
                  style={{ background: "rgba(0,255,136,0.08)", borderColor: "rgba(0,255,136,0.2)", color: "var(--accent)", opacity: loadingReport === r.type ? 0.6 : 1 }}
                >
                  {loadingReport === r.type ? "Generating..." : `${r.label} ↗`}
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-[10px] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] mb-3" style={{ color: "var(--text2)" }}>AI Insights</div>
            <div className="flex flex-col gap-2">
              <div className="rounded-md p-2.5 border" style={{ background: "rgba(0,255,136,0.05)", borderColor: "rgba(0,255,136,0.15)" }}>
                <div className="text-[10px] font-bold mb-1" style={{ color: "var(--accent)" }}>OPPORTUNITY</div>
                <div className="text-[11px]" style={{ color: "var(--text2)" }}>Banking sector showing bullish momentum this week</div>
              </div>
              <div className="rounded-md p-2.5 border" style={{ background: "rgba(255,215,0,0.05)", borderColor: "rgba(255,215,0,0.15)" }}>
                <div className="text-[10px] font-bold mb-1" style={{ color: "var(--yellow)" }}>RISK ALERT</div>
                <div className="text-[11px]" style={{ color: "var(--text2)" }}>High IT concentration — consider rebalancing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
