"use client";

import { useEffect, useState } from "react";
import { PLANS, formatCredits } from "@/lib/plans";
import { useDialog } from "@/components/DialogProvider";
import { useLanguage } from "@/components/LanguageProvider";

type SubscriptionState = {
  plan: "starter" | "creator" | "pro";
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
} | null;

/** Custom page rendered inside Clerk's "Manage account" (UserProfile) modal. */
export function AccountSubscriptionPage() {
  const { confirm } = useDialog();
  const { t, bcp47 } = useLanguage();
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);

  async function refresh() {
    const res = await fetch("/api/subscription");
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription);
    }
    setLoaded(true);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, []);

  async function handleCancel() {
    const ok = await confirm(t.accountSubscription.cancelConfirm, {
      title: t.accountSubscription.cancelTitle,
      confirmLabel: t.accountSubscription.confirmCancel,
      danger: true,
    });
    if (!ok) return;
    setWorking(true);
    await fetch("/api/subscription/cancel", { method: "POST" });
    await refresh();
    window.dispatchEvent(new Event("subscription-changed"));
    setWorking(false);
  }

  async function handleResume() {
    setWorking(true);
    await fetch("/api/subscription/resume", { method: "POST" });
    await refresh();
    window.dispatchEvent(new Event("subscription-changed"));
    setWorking(false);
  }

  if (!loaded) return null;

  if (!subscription) {
    return (
      <div className="flex flex-col gap-2 p-4 text-[14px] text-[var(--ink-secondary)]">
        {t.accountSubscription.noActiveSubscription}
      </div>
    );
  }

  const planInfo = PLANS[subscription.plan];
  const renewsDate = new Date(subscription.renewsAt).toLocaleDateString(bcp47, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5 p-1">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--ink-tertiary)]">
          {t.accountSubscription.activePlan}
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          {planInfo.name}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
          {t.accountSubscription.creditsRemaining(
            formatCredits(subscription.creditsRemaining),
            formatCredits(subscription.creditsTotal)
          )}
        </p>
      </div>

      {subscription.cancelAtPeriodEnd ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[var(--bg-secondary)] p-4">
          <p className="text-[13px] text-[var(--ink-secondary)]">
            {t.accountSubscription.cancelledMessage(renewsDate)}
          </p>
          <button
            onClick={handleResume}
            disabled={working}
            className="pill-black self-start rounded-full px-4 py-2 text-[13px] font-medium disabled:opacity-40"
          >
            {t.accountSubscription.resume}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl bg-[var(--bg-secondary)] p-4">
          <p className="text-[13px] text-[var(--ink-secondary)]">
            {t.accountSubscription.nextRenewal(renewsDate)}
          </p>
          <button
            onClick={handleCancel}
            disabled={working}
            className="self-start rounded-full px-4 py-2 text-[13px] font-medium text-[var(--red)] ring-1 ring-[var(--line)] transition-colors hover:bg-white disabled:opacity-40"
          >
            {t.accountSubscription.cancelButton}
          </button>
          <p className="text-[11px] text-[var(--ink-tertiary)]">
            {t.accountSubscription.finePrint(renewsDate)}
          </p>
        </div>
      )}
    </div>
  );
}
