"use client";

import Link from "next/link";
import type { Generation } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useDialog } from "@/components/DialogProvider";
import { useLanguage } from "@/components/LanguageProvider";

export function GenerationCard({
  generation,
  onDeleted,
}: {
  generation: Generation;
  onDeleted: () => void;
}) {
  const { confirm } = useDialog();
  const { t } = useLanguage();
  const completedCount = generation.generation_videos.filter(
    (v) => v.status === "completed"
  ).length;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm(t.generationCard.deleteConfirm(generation.product_name), {
      title: t.generationCard.deleteTitle,
      confirmLabel: t.common.delete,
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/generations/${generation.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDeleted();
    }
  }

  return (
    <Link
      href={`/dashboard/generations/${generation.id}`}
      className="card-shadow group flex items-center gap-4 rounded-2xl bg-[var(--bg-elevated)] p-3.5 transition-transform hover:-translate-y-0.5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={generation.product_image_url}
        alt={generation.product_name}
        className="h-14 w-14 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-medium text-[var(--ink)]">
          {generation.product_name}
        </span>
        <span className="text-[12px] text-[var(--ink-tertiary)]">
          {t.generationCard.videosReady(completedCount, generation.generation_videos.length)}
        </span>
      </div>
      <StatusBadge status={generation.status} />
      <button
        onClick={handleDelete}
        aria-label={t.generationCard.deleteAria}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink-tertiary)] opacity-0 transition-opacity hover:bg-[var(--bg-secondary)] hover:text-[var(--red)] group-hover:opacity-100 pointer-coarse:opacity-100"
      >
        ✕
      </button>
    </Link>
  );
}
