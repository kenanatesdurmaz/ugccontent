import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PLANS, type PlanId } from "@/lib/plans";
import { getSubscription, setSubscriptionPlan } from "@/lib/subscription-server";
import { notifySubscriptionCreated } from "@/lib/admin-notifications-server";
import { isAdminUser } from "@/lib/admin";

const PLAN_IDS = Object.keys(PLANS) as PlanId[];

/**
 * Real subscriptions are now granted by the verified Gumroad webhook
 * (app/api/webhooks/gumroad), triggered by an actual payment — see
 * lib/gumroad.ts. This route directly grants credits with no payment
 * behind it, so it's restricted to admins only (manual grants/testing);
 * it used to be callable by any signed-in user back when there was no
 * real payment provider at all.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
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
