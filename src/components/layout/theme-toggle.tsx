"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("milideas-theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("milideas-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("milideas-theme", "light");
    }
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface/80 text-base shadow-sm backdrop-blur-md transition-all hover:bg-arena hover:scale-105 active:scale-95 cursor-pointer"
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Noche"}
      aria-label="Cambiar tema visual"
    >
      <span>{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}
