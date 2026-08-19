"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

/** Shown when a subscribed user doesn't have enough credits left for the selected video. */
export function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="card-shadow relative w-full max-w-sm rounded-3xl bg-white p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--ink)]"
        >
          ✕
        </button>

        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-2xl">
          🔒
        </span>

        <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--ink)]">
          {t.upgradeModal.heading}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          {t.upgradeModal.body}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/pricing"
            className="pill-black rounded-full px-5 py-3 text-[14px] font-medium"
          >
            {t.upgradeModal.viewPlans}
          </Link>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-3 text-[14px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink)]"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
