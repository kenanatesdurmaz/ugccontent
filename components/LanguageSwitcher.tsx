"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => setLocale(e.target.value as (typeof LOCALES)[number])}
      className={
        className ??
        "rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink)] focus:outline-none"
      }
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
