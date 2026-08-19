"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { setPendingPlan, openCheckoutAndWatch } from "@/lib/subscription";
import { getCheckoutUrl } from "@/lib/gumroad";

/**
 * "Subscribing" now sends the user to the real Gumroad checkout for the
 * plan, with their Clerk account email pre-filled — the verified webhook
 * (app/api/webhooks/gumroad) attributes a completed payment back to this
 * account by matching that email server-side. Nothing is granted
 * client-side anymore; openCheckoutAndWatch polls in the background and
 * closes the tab once the credit actually lands.
 */
export function SubscribeCta({
  plan,
  className,
  children,
}: {
  plan: PlanId;
  className?: string;
  children: ReactNode;
}) {
  const { isSignedIn, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const [waiting, setWaiting] = useState(false);

  if (isSignedIn && email) {
    return (
      <button
        className={className}
        disabled={waiting}
        onClick={() => {
          setWaiting(true);
          openCheckoutAndWatch(getCheckoutUrl(plan, email), () => setWaiting(false));
        }}
      >
        {waiting ? "Ödeme bekleniyor..." : children}
      </button>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
      <button className={className} onClick={() => setPendingPlan(plan)}>
        {children}
      </button>
    </SignInButton>
  );
}
