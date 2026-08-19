"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { SubscribeCta } from "@/components/SubscribeCta";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Shows a static "Subscribed" badge instead of the subscribe button for
 * whichever plan the user is currently on, so it's unambiguous which plan
 * is active (rather than letting them re-click "Subscribe" on it).
 */
export function PlanCta({
  plan,
  className,
  activeClassName,
  children,
}: {
  plan: PlanId;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
}) {
  const [activePlan, setActivePlan] = useState<PlanId | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.subscription) {
          setActivePlan(data.subscription.plan);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (activePlan === plan) {
    return (
      <span
        className={`flex items-center justify-center gap-1.5 ${activeClassName ?? className}`}
      >
        <span aria-hidden>✓</span> {t.common.subscribed}
      </span>
    );
  }

  return (
    <SubscribeCta plan={plan} className={className}>
      {children}
    </SubscribeCta>
  );
}
