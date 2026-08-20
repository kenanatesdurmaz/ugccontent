import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productIdToPlan, verifyGumroadSale, verifyGumroadSubscriber } from "@/lib/gumroad";
import {
  cancelSubscription,
  getSubscription,
  resumeSubscription,
  setSubscriptionPlan,
} from "@/lib/subscription-server";
import { notifySubscriptionCreated } from "@/lib/admin-notifications-server";
import { testModeAllowed } from "@/lib/app-settings-server";
import { PLANS } from "@/lib/plans";

/**
 * Finds the Clerk account a Gumroad sale belongs to by email — a real
 * sale's payload has no generic passthrough field for a custom user id, so
 * matching on the buyer's email (pre-filled from the Clerk account on
 * checkout, see getCheckoutUrl) is what's actually reliable here.
 */
async function findClerkUserByEmail(email: string): Promise<string | null> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ emailAddress: [email] });
  if (data.length !== 1) return null;
  return data[0].id;
}

/**
 * Looks up which Clerk account a Gumroad subscription belongs to via the
 * gumroad_sales log (populated by every sale ping) — the
 * cancellation/subscription_restarted pings identify the subscription
 * only by subscription_id, with no buyer email to match on directly.
 */
async function findClerkUserBySubscriptionId(subscriptionId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("gumroad_sales")
    .select("clerk_user_id")
    .eq("gumroad_subscription_id", subscriptionId)
    .not("clerk_user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.clerk_user_id as string | undefined) ?? null;
}

/**
 * Gumroad "Ping" webhook, reused for multiple resource_subscription event
 * types (see app/api/webhooks/gumroad/route.ts registration notes below):
 * sale pings identify themselves via sale_id, cancellation/
 * subscription_restarted pings via subscription_id plus their own marker
 * field. None of these are signed, so every branch re-fetches the real
 * state server-to-server rather than trusting the posted body.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const saleId = form.get("sale_id")?.toString();
  if (saleId) {
    return handleSalePing(saleId);
  }

  const subscriptionId = form.get("subscription_id")?.toString();
  if (subscriptionId && form.get("cancelled_at")) {
    return handleCancellationPing(subscriptionId);
  }
  if (subscriptionId && form.get("restarted_at")) {
    return handleRestartPing(subscriptionId);
  }

  // Some other resource_subscription event we're not registered for /
  // don't act on (e.g. subscription_updated) — ack so Gumroad stops
  // retrying instead of treating it as a failure.
  return NextResponse.json({ ok: true, skipped: "unhandled_resource" });
}

/**
 * A real Gumroad cancellation confirmed via re-fetch — this is the only
 * place cancelSubscription() gets called, so the UI's "cancelled" state
 * only ever reflects what actually happened on Gumroad's side.
 */
async function handleCancellationPing(subscriptionId: string) {
  let subscriber;
  try {
    subscriber = await verifyGumroadSubscriber(subscriptionId);
  } catch (err) {
    console.error("Gumroad subscriber verification failed", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  if (!subscriber.cancelled_at) {
    // Ping fired but the re-fetched subscriber isn't actually cancelled
    // (e.g. already restarted since) — nothing to do.
    return NextResponse.json({ ok: true, skipped: "not_cancelled" });
  }

  const clerkUserId = await findClerkUserBySubscriptionId(subscriptionId);
  if (!clerkUserId) {
    console.error("Gumroad cancellation for unattributed subscription", subscriptionId);
    return NextResponse.json({ ok: true, skipped: "unattributed" });
  }

  await cancelSubscription(clerkUserId);
  return NextResponse.json({ ok: true });
}

/** Undoes cancel_at_period_end once Gumroad confirms the membership is alive again. */
async function handleRestartPing(subscriptionId: string) {
  let subscriber;
  try {
    subscriber = await verifyGumroadSubscriber(subscriptionId);
  } catch (err) {
    console.error("Gumroad subscriber verification failed", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  if (subscriber.status !== "alive") {
    return NextResponse.json({ ok: true, skipped: "not_alive" });
  }

  const clerkUserId = await findClerkUserBySubscriptionId(subscriptionId);
  if (!clerkUserId) {
    console.error("Gumroad restart for unattributed subscription", subscriptionId);
    return NextResponse.json({ ok: true, skipped: "unattributed" });
  }

  await resumeSubscription(clerkUserId);
  return NextResponse.json({ ok: true });
}

/**
 * Fires on every sale, including each recurring membership charge.
 * Credits are granted additively per real charge (setSubscriptionPlan is
 * already additive) — this intentionally does NOT touch the existing
 * calendar-based auto-rollover in getSubscription(); the two can grant
 * independently of each other until that's reconciled on purpose.
 */
async function handleSalePing(saleId: string) {
  let sale;
  try {
    sale = await verifyGumroadSale(saleId);
  } catch (err) {
    console.error("Gumroad sale verification failed", err);
    // Unverifiable — let Gumroad retry rather than silently dropping it.
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  if (sale.test && !testModeAllowed()) {
    console.warn("Ignoring Gumroad test sale in production", saleId);
    return NextResponse.json({ ok: true, skipped: "test_sale" });
  }

  const plan = productIdToPlan(sale.product_id);
  const buyerEmail = sale.purchase_email ?? sale.email;
  const clerkUserId = buyerEmail ? await findClerkUserByEmail(buyerEmail) : null;

  const supabase = getSupabaseAdmin();
  const { error: insertError } = await supabase.from("gumroad_sales").insert({
    sale_id: saleId,
    gumroad_subscription_id: sale.subscription_id ?? null,
    clerk_user_id: clerkUserId,
    plan,
    price_cents: sale.price,
    currency: sale.currency,
    raw: sale,
  });

  if (insertError) {
    // Unique violation on sale_id = already processed (retry/duplicate
    // ping) — idempotent no-op, not an error.
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, skipped: "duplicate" });
    }
    console.error("Failed to record Gumroad sale", insertError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!plan) {
    console.error("Gumroad sale for unrecognized product", sale.product_id, saleId);
    return NextResponse.json({ ok: true, skipped: "unknown_product" });
  }
  if (!clerkUserId) {
    console.error("Gumroad sale email didn't match exactly one Clerk account", buyerEmail, saleId);
    return NextResponse.json({ ok: true, skipped: "unattributed" });
  }

  await setSubscriptionPlan(clerkUserId, plan);

  const subscription = await getSubscription(clerkUserId);
  if (subscription) {
    notifySubscriptionCreated(saleId, clerkUserId, {
      userEmail: sale.email,
      plan,
      amount: `$${(sale.price / 100).toFixed(2)}`,
      creditsGranted: PLANS[plan].credits,
      startedAt: new Date().toISOString(),
      renewsAt: subscription.renewsAt,
      transactionId: saleId,
    });
  }

  return NextResponse.json({ ok: true });
}
