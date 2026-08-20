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

/**
 * Custom page rendered inside Clerk's "Manage account" (UserProfile)
 * modal. That modal is permanently light-themed (see ClerkProvider's
 * colorBackground in app/layout.tsx) regardless of the site's own
 * light/dark toggle, so this deliberately uses fixed light colors instead
 * of the site's theme-reactive CSS vars — using --ink etc. here made
 * everything unreadable in dark mode (text picking up the dark-mode
 * color while still sitting on Clerk's fixed white background).
 */
export function AccountSubscriptionPage() {
  const { confirm } = useDialog();
  const { t, bcp47 } = useLanguage();
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [loaded, setLoaded] = useState(false);

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

  function openGumroadLibrary() {
    window.open("https://app.gumroad.com/library", "_blank", "noopener,noreferrer");
  }

  async function handleCancel() {
    const ok = await confirm(t.accountSubscription.cancelConfirm, {
      title: t.accountSubscription.cancelTitle,
      confirmLabel: t.accountSubscription.confirmCancel,
      danger: true,
    });
    if (!ok) return;
    // Gumroad's API has no seller-side cancel endpoint, so the actual
    // cancellation can only happen on Gumroad's own site. This
    // deliberately does NOT set any "cancelled" state here — that comes
    // only from Gumroad's cancellation webhook (see
    // app/api/webhooks/gumroad/route.ts), once it's confirmed there, so
    // this page never shows "cancelled" for something that didn't
    // actually happen.
    openGumroadLibrary();
  }

  if (!loaded) return null;

  if (!subscription) {
    return (
      <div className="flex flex-col gap-2 p-4 text-[14px] text-[#6e6e73]">
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
        <p className="text-[12px] font-medium uppercase tracking-wide text-[#86868b]">
          {t.accountSubscription.activePlan}
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
          {planInfo.name}
        </h3>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          {t.accountSubscription.creditsRemaining(
            formatCredits(subscription.creditsRemaining),
            formatCredits(subscription.creditsTotal)
          )}
        </p>
      </div>

      {subscription.cancelAtPeriodEnd ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#f5f5f7] p-4">
          <p className="text-[13px] text-[#6e6e73]">
            {t.accountSubscription.cancelledMessage(renewsDate)}
          </p>
          <button
            onClick={openGumroadLibrary}
            className="self-start rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            {t.accountSubscription.gumroadLink}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#f5f5f7] p-4">
          <p className="text-[13px] text-[#6e6e73]">
            {t.accountSubscription.nextRenewal(renewsDate)}
          </p>
          <button
            onClick={handleCancel}
            className="self-start rounded-full px-4 py-2 text-[13px] font-medium text-[#d93025] ring-1 ring-black/10 transition-colors hover:bg-white"
          >
            {t.accountSubscription.cancelButton}
          </button>
          <p className="text-[11px] text-[#86868b]">
            {t.accountSubscription.finePrint(renewsDate)}
          </p>
        </div>
      )}
    </div>
  );
}
