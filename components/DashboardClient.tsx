"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Generation } from "@/lib/types";
import { GenerationForm } from "@/components/GenerationForm";
import { GenerationCard } from "@/components/GenerationCard";
import { SubscribedToast } from "@/components/SubscribedToast";
import { SubscriptionPanel } from "@/components/SubscriptionPanel";
import { markJustSubscribed } from "@/lib/subscription";
import { useLanguage } from "@/components/LanguageProvider";

export function DashboardClient() {
  const [generations, setGenerations] = useState<Generation[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    // Gumroad redirects back here (?subscribed=1) once a real payment
    // completes — the credit grant itself already happened server-side via
    // the verified webhook, this just surfaces the "Subscribed" toast and
    // strips the param so refreshing the page doesn't re-trigger it.
    if (searchParams.get("subscribed") === "1") {
      markJustSubscribed();
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

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
          {t.dashboard.title}
        </h1>
        <p className="mt-2 text-[var(--ink-secondary)]">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <SubscriptionPanel />
        <GenerationForm onCreated={loadGenerations} />
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex items-center justify-between gap-4"
        >
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)]">
            <ChevronDown
              size={16}
              className={`text-[var(--ink-tertiary)] transition-transform ${historyOpen ? "rotate-180" : ""}`}
            />
            {t.dashboard.historyHeading}
          </span>
          {generations && (
            <span className="text-[13px] text-[var(--ink-tertiary)]">
              {t.dashboard.recordsCount(generations.length)}
            </span>
          )}
        </button>

        {historyOpen && (
          <>
            {generations === null && (
              <p className="text-[14px] text-[var(--ink-tertiary)]">{t.common.loading}</p>
            )}
            {generations !== null && generations.length === 0 && (
              <p className="text-[14px] text-[var(--ink-secondary)]">{t.dashboard.emptyHistory}</p>
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
          </>
        )}
      </div>
    </div>
  );
}
