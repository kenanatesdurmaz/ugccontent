"use client";

import type { GenerationStatus } from "@/lib/types";
import { useLanguage } from "@/components/LanguageProvider";

const DOT: Record<GenerationStatus, string> = {
  pending: "bg-[var(--ink-tertiary)]",
  processing: "bg-[var(--amber)] pulse",
  completed: "bg-[var(--green)]",
  failed: "bg-[var(--red)]",
};

export function StatusBadge({ status }: { status: GenerationStatus }) {
  const { t } = useLanguage();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-secondary)]">
      <span className={`status-dot ${DOT[status]}`} />
      {t.statusBadge[status]}
    </span>
  );
}
