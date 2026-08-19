"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ugcbeam_theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolve(theme: Theme): ResolvedTheme {
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Persists an explicit light/dark choice to localStorage; "system" (the
 * default until the user picks a side) tracks the OS preference live via
 * a matchMedia listener. app/layout.tsx also runs a tiny inline script
 * before hydration that applies the same resolution, so there's no
 * flash of the wrong theme on load.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = stored === "light" || stored === "dark" ? stored : "system";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a user preference stored outside React
    setThemeState(initial);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function sync() {
      const next = resolve(theme);
      setResolvedTheme(next);
      document.documentElement.setAttribute("data-theme", next);
    }

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
