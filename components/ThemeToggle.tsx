"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--ink)]"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
