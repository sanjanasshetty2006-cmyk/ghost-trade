import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        bg2: "#0a0a0a",
        card: "#111111",
        card2: "#161616",
        border: "#1e1e1e",
        accent: "#00FF88",
        accent2: "#00c46a",
        gt: {
          text: "#f0f0f0",
          text2: "#888888",
          text3: "#555555",
          red: "#ff4d4d",
          yellow: "#ffd700",
          blue: "#3b82f6",
        },
      },
      fontFamily: {
        head: ["Syne", "sans-serif"],
        mono: ["Space Mono", "monospace"],
        body: ["DM Sans", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px #00FF88, 0 0 40px #00FF8840" },
          "50%": { boxShadow: "0 0 40px #00FF88, 0 0 80px #00FF8880" },
        },
        pixelReveal: {
          from: { clipPath: "inset(100% 0 0 0)", opacity: "0" },
          to: { clipPath: "inset(0% 0 0 0)", opacity: "1" },
        },
        candleRise: {
          from: { scaleY: "0", opacity: "0" },
          to: { scaleY: "1", opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease",
        glowPulse: "glowPulse 2s ease-in-out infinite",
        pixelReveal: "pixelReveal 0.8s ease forwards",
        candleRise: "candleRise 0.6s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
