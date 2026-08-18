"use client";

import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import type { PlanId } from "@/lib/plans";
import { markJustSubscribed, setPendingPlan } from "@/lib/subscription";

/**
 * No real payment provider is wired up yet, so "subscribing" just calls
 * POST /api/subscribe, which creates a real subscriptions row (plan +
 * credits) in Supabase — same sign-in gating as DashboardCta.
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
  const { isSignedIn } = useUser();
  const router = useRouter();

  async function subscribe() {
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    markJustSubscribed();
  }

  if (isSignedIn) {
    return (
      <button
        className={className}
        onClick={async () => {
          await subscribe();
          router.push("/dashboard");
        }}
      >
        {children}
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
