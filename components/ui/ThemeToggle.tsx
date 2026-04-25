"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const LS_KEY = "fleetos_theme";

export function applyTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(LS_KEY, theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem(LS_KEY) as "dark" | "light") ?? "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:bg-surface2"
      style={{ borderColor: "var(--border)", color: theme === "dark" ? "#facc15" : "var(--text2)" }}
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
