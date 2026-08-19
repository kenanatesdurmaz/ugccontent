"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALE_BCP47, isLocale, type Locale } from "@/lib/i18n/locales";
import { DICTIONARIES } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/types";

const STORAGE_KEY = "ugcbeam_locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  bcp47: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Client-only locale switching (no /en /es routing) — picked deliberately
 * to avoid restructuring every route (including Clerk's auth pages and
 * proxy.ts) under an app/[locale] segment for what's a simple language
 * toggle, not an SEO-driven multi-region site.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a user preference stored outside React
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: DICTIONARIES[locale], bcp47: LOCALE_BCP47[locale] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
