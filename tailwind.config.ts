import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: "#07090f",
        sidebar: "#0c1018",
        surface: "#111827",
        surface2: "#1a2336",
        surface3: "#1f2d42",
        border: "#1e2d45",
        accent: "#2563eb",
        "accent-light": "#3b82f6",
        green: "#10b981",
        yellow: "#f59e0b",
        red: "#ef4444",
        cyan: "#06b6d4",
        text: "#f1f5f9",
        text2: "#94a3b8",
        text3: "#475569",
      },
      animation: {
        "pulse-red": "pulse-red 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
