"use client";

import { useEffect, useState } from "react";
import { consumeJustSubscribed } from "@/lib/subscription";
import { useLanguage } from "@/components/LanguageProvider";

export function SubscribedToast() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (consumeJustSubscribed()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time toast triggered by a sessionStorage flag set on the previous page
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={() => setVisible(false)}
    >
      <div
        className="reveal card-shadow relative flex aspect-square w-full max-w-[220px] flex-col items-center justify-center gap-3 rounded-3xl bg-[var(--bg-elevated)] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setVisible(false)}
          aria-label={t.common.close}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--bg-secondary)]"
        >
          ✕
        </button>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green)] text-2xl text-white">
          ✓
        </span>
        <span className="text-[16px] font-semibold text-[var(--ink)]">
          {t.toast.subscribed}
        </span>
      </div>
    </div>
  );
}
