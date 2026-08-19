"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { setPendingPlan } from "@/lib/subscription";
import { getCheckoutUrl } from "@/lib/gumroad";

/**
 * "Subscribing" now sends the user to the real Gumroad checkout for the
 * plan, with their Clerk account email pre-filled — the verified webhook
 * (app/api/webhooks/gumroad) attributes a completed payment back to this
 * account by matching that email server-side. Nothing is granted
 * client-side anymore.
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

  if (isSignedIn && email) {
    return (
      <a href={getCheckoutUrl(plan, email)} className={className}>
        {children}
      </a>
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
