"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Generation } from "@/lib/types";
import { GenerationForm } from "@/components/GenerationForm";
import { GenerationCard } from "@/components/GenerationCard";
import { SubscribedToast } from "@/components/SubscribedToast";
import { SubscriptionPanel } from "@/components/SubscriptionPanel";

export function DashboardClient() {
  const [generations, setGenerations] = useState<Generation[] | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadGenerations = useCallback(async () => {
    const res = await fetch("/api/generations");
    if (!res.ok) return;
    const data = await res.json();
    setGenerations(data.generations);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    loadGenerations();
  }, [loadGenerations]);

  useEffect(() => {
    const hasActive = generations?.some(
      (g) => g.status === "pending" || g.status === "processing"
    );

    if (hasActive) {
      pollRef.current = setInterval(loadGenerations, 5000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [generations, loadGenerations]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
      <SubscribedToast />
      <div>
        <h1 className="text-[clamp(1.9rem,4vw,2.75rem)] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          Panel
        </h1>
        <p className="mt-2 text-[var(--ink-secondary)]">
          Ürün fotoğrafından UGC reklam videosu üret ve geçmiş üretimlerini
          buradan takip et.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <SubscriptionPanel />
        <GenerationForm onCreated={loadGenerations} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--ink)]">
            Geçmiş üretimler
          </h2>
          {generations && (
            <span className="text-[13px] text-[var(--ink-tertiary)]">
              {generations.length} kayıt
            </span>
          )}
        </div>

        {generations === null && (
          <p className="text-[14px] text-[var(--ink-tertiary)]">Yükleniyor...</p>
        )}
        {generations !== null && generations.length === 0 && (
          <p className="text-[14px] text-[var(--ink-secondary)]">
            Henüz bir üretim yok. Yukarıdaki formu doldurarak başla.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {generations?.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              onDeleted={loadGenerations}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
