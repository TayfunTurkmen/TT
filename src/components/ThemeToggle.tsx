"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tt-theme";

type Props = {
  lightLabel: string;
  darkLabel: string;
};

export function ThemeToggle({ lightLabel, darkLabel }: Props) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-[var(--border)] bg-[var(--chip)] px-2 py-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]"
      aria-label={isDark ? lightLabel : darkLabel}
      title={isDark ? lightLabel : darkLabel}
    >
      {isDark ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
