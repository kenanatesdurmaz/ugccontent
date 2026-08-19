"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { PLANS, formatCredits } from "@/lib/plans";
import { consumePendingPlan, openCheckoutAndWatch } from "@/lib/subscription";
import { getCheckoutUrl } from "@/lib/gumroad";

type SubscriptionState = {
  plan: "starter" | "creator" | "pro";
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
} | null;

export function SubscriptionPanel() {
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [loaded, setLoaded] = useState(false);
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (!userLoaded) return;

    // A plan picked before sign-in (see SubscribeCta) sends the user to
    // Gumroad checkout now that we know who they are — credits are
    // granted by the verified webhook once the payment actually
    // completes, not here.
    const pendingPlan = consumePendingPlan();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (pendingPlan && email) {
      openCheckoutAndWatch(getCheckoutUrl(pendingPlan, email));
    }

    async function init() {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
      setLoaded(true);
      window.dispatchEvent(new Event("subscription-changed"));
    }
    init();
  }, [userLoaded, user]);

  if (!loaded) {
    return (
      <div className="card-shadow flex animate-pulse flex-col gap-3 rounded-3xl bg-[var(--bg-secondary)] p-5">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 rounded bg-[var(--line)]" />
          <div className="h-5 w-20 rounded bg-[var(--line)]" />
        </div>
        <div className="h-8 w-28 rounded-full bg-[var(--line)]" />
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-full rounded-full bg-[var(--line)]" />
          <div className="h-3 w-32 rounded bg-[var(--line)]" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="card-shadow flex flex-col gap-2 rounded-3xl bg-[var(--bg-secondary)] p-5">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--ink-tertiary)]">
          Aktif plan
        </p>
        <p className="text-[13px] text-[var(--ink-secondary)]">
          Video üretmek için bir plana abone olmalısın.
        </p>
        <Link
          href="/pricing"
          className="pill-black mt-1 self-start rounded-full px-4 py-2 text-[13px] font-medium"
        >
          Planları görüntüle
        </Link>
      </div>
    );
  }

  const planInfo = PLANS[subscription.plan];
  const renewsDate = new Date(subscription.renewsAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const pct = Math.min(
    100,
    Math.round((subscription.creditsUsed / subscription.creditsTotal) * 100)
  );

  return (
    <div className="card-shadow flex flex-col gap-3 rounded-3xl bg-[var(--bg-secondary)] p-5">
      <div className="flex flex-col gap-0.5">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--ink-tertiary)]">
          Aktif plan
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          {planInfo.name}
        </h3>
      </div>

      <span className="w-fit rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)] ring-1 ring-[var(--line)]">
        {formatCredits(subscription.creditsRemaining)} kredi kaldı
      </span>

      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[12px] text-[var(--ink-tertiary)]">
          {formatCredits(subscription.creditsUsed)} / {formatCredits(subscription.creditsTotal)}{" "}
          kredi kullanıldı
        </p>
        <p className="text-[12px] text-[var(--ink-tertiary)]">
          {subscription.cancelAtPeriodEnd
            ? `İptal edildi — ${renewsDate} tarihine kadar aktif`
            : `Yenilenme: ${renewsDate}`}
        </p>
      </div>

      {subscription.plan !== "pro" && (
        <Link
          href="/pricing"
          className="mt-1 self-start rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[var(--ink)] ring-1 ring-[var(--line)] transition-colors hover:bg-[var(--bg-tertiary)]"
        >
          Planı yükselt
        </Link>
      )}
    </div>
  );
}
