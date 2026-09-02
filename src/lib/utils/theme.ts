"use client";

import { useEffect, useState } from "react";

export function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("milideas-theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return false; // Default to light mode
}

export function applyTheme(isDark: boolean) {
  if (typeof window === "undefined") return;
  if (isDark) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("milideas-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("milideas-theme", "light");
  }
  window.dispatchEvent(new CustomEvent("milideas-theme-changed", { detail: { isDark } }));
}

export function useMilideasTheme() {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Initial sync
    const initial = getInitialTheme();
    setIsDark(initial);
    if (initial) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isDark === "boolean") {
        setIsDark(customEvent.detail.isDark);
      } else {
        const stored = localStorage.getItem("milideas-theme");
        setIsDark(stored === "dark");
      }
    };

    window.addEventListener("milideas-theme-changed", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("milideas-theme-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  };

  const setTheme = (val: boolean) => {
    setIsDark(val);
    applyTheme(val);
  };

  return { isDark, toggle, setTheme };
}
