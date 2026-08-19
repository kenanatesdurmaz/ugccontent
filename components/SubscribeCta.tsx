"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { setPendingPlan } from "@/lib/subscription";
import { getCheckoutUrl } from "@/lib/gumroad";

/**
 * "Subscribing" now sends the user to the real Gumroad checkout for the
 * plan, with their Clerk user id attached as a URL param — Gumroad echoes
 * it back in the sale's url_params, which is how the verified webhook
 * (app/api/webhooks/gumroad) attributes a completed payment to this
 * account and grants credits. Nothing is granted client-side anymore.
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

  if (isSignedIn) {
    return (
      <a href={getCheckoutUrl(plan, user.id)} className={className}>
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
