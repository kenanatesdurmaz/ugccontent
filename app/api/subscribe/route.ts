import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { getSubscription, setSubscriptionPlan } from "@/lib/subscription-server";
import { notifySubscriptionCreated } from "@/lib/admin-notifications-server";

const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/**
 * No real payment provider is wired up yet, so "subscribing" just creates
 * the subscription row directly. Swap this for a Stripe checkout + webhook
 * once real billing exists — the credit system itself already works for
 * real off of the `subscriptions` table.
 *
 * The admin notification below is fired only after the subscription is
 * durably committed, using values read back from the database (never
 * anything from the request body) — the same shape a real payment
 * webhook handler would follow, just without a real payment behind it
 * yet. Swap the trigger point for a verified webhook event once Stripe
 * (or similar) is wired up; `notifySubscriptionCreated`'s idempotency
 * (unique `event_id`) is already built for that.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const plan = body?.plan as string | undefined;

  if (!plan || !PLAN_IDS.includes(plan as PlanId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await setSubscriptionPlan(userId, plan as PlanId);

  // Re-read the committed state rather than trusting anything computed
  // before the write — the notification reflects what's actually in the
  // DB now.
  const subscription = await getSubscription(userId);
  if (subscription) {
    const user = await currentUser();
    const userEmail =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      "unknown";

    const transactionId = `sim_${crypto.randomUUID()}`;
    // Fire-and-forget: notification delivery must never block or fail
    // this response — the subscription is already committed.
    notifySubscriptionCreated(transactionId, userId, {
      userEmail,
      plan: plan as PlanId,
      amount: PLANS[plan as PlanId].price,
      creditsGranted: PLANS[plan as PlanId].credits,
      startedAt: new Date().toISOString(),
      renewsAt: subscription.renewsAt,
      transactionId,
    });
  }

  return NextResponse.json({ ok: true });
}
