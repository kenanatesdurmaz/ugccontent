import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { productIdToPlan, verifyGumroadSale } from "@/lib/gumroad";
import { getSubscription, setSubscriptionPlan } from "@/lib/subscription-server";
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
 * Gumroad "Ping" webhook — fires on every sale, including each recurring
 * membership charge. Gumroad pings aren't signed, so authenticity comes
 * from re-fetching the sale server-to-server via our access token
 * (verifyGumroadSale) rather than trusting the posted form body directly.
 *
 * Credits are granted additively per real charge (setSubscriptionPlan is
 * already additive) — this intentionally does NOT touch the existing
 * calendar-based auto-rollover in getSubscription(); the two can grant
 * independently of each other until that's reconciled on purpose.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const saleId = form?.get("sale_id")?.toString();
  if (!saleId) {
    return NextResponse.json({ error: "Missing sale_id" }, { status: 400 });
  }

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
