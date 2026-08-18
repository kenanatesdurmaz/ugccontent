import { getSupabaseAdmin } from "@/lib/supabase";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Adds a real calendar month rather than a fixed 30 days (30 days short-
 * changes any 31-day month). Clamps to the target month's last day
 * instead of letting e.g. Jan 31 + 1 month overflow into March.
 */
function addOneMonth(date: Date): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + 1;
  result.setMonth(targetMonth);
  if (result.getMonth() !== targetMonth % 12) {
    result.setDate(0);
  }
  return result;
}

export type SubscriptionState = {
  plan: PlanId;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  renewsAt: string;
  cancelAtPeriodEnd: boolean;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

/**
 * Reads the user's subscription. If the current cycle has elapsed:
 * - normally, the new cycle's plan credits are added on top of whatever
 *   is left — unused credits are never wiped, they just keep
 *   accumulating — a stand-in for a real billing-cycle webhook, since
 *   there's no payment provider wired up yet.
 * - if the user canceled (cancel_at_period_end), the subscription instead
 *   ends for good once the paid period runs out.
 */
export async function getSubscription(
  userId: string
): Promise<SubscriptionState | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const plan = data.plan as PlanId;
  const renewsAt = new Date(data.renews_at as string);
  const now = new Date();

  if (renewsAt.getTime() <= now.getTime() && data.cancel_at_period_end) {
    await supabase.from("subscriptions").delete().eq("clerk_user_id", userId);
    return null;
  }

  // numeric columns can come back as strings from postgrest.
  const creditsUsed = Number(data.credits_used);
  let creditsGranted = Number(data.credits_granted);
  let nextRenewsAt = renewsAt;
  let renewed = false;

  while (nextRenewsAt.getTime() <= now.getTime()) {
    creditsGranted = round1(creditsGranted + PLANS[plan].credits);
    nextRenewsAt = addOneMonth(nextRenewsAt);
    renewed = true;
  }

  if (renewed) {
    await supabase
      .from("subscriptions")
      .update({
        credits_granted: creditsGranted,
        renews_at: nextRenewsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", userId);
  }

  return {
    plan,
    creditsTotal: creditsGranted,
    creditsUsed,
    creditsRemaining: creditsGranted - creditsUsed,
    renewsAt: nextRenewsAt.toISOString(),
    cancelAtPeriodEnd: data.cancel_at_period_end as boolean,
  };
}

/**
 * Starts a plan, or switches to a different one. If the user already has
 * an active subscription, whatever credits they have left are kept and
 * the new plan's credits are added on top (not replaced) — they already
 * paid for those. A brand-new subscriber just gets the plan's credits.
 * Either way this resets/extends the renewal date and clears any pending
 * cancellation.
 */
export async function setSubscriptionPlan(userId: string, plan: PlanId) {
  const supabase = getSupabaseAdmin();
  const existing = await getSubscription(userId);
  const renewsAt = addOneMonth(new Date()).toISOString();

  const creditsGranted = existing
    ? round1(existing.creditsTotal + PLANS[plan].credits)
    : PLANS[plan].credits;
  const creditsUsed = existing ? existing.creditsUsed : 0;

  const { error } = await supabase.from("subscriptions").upsert({
    clerk_user_id: userId,
    plan,
    credits_granted: creditsGranted,
    credits_used: creditsUsed,
    renews_at: renewsAt,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/**
 * Cancels at the end of the current (already paid for) period — the
 * subscription and its remaining credits stay usable until `renews_at`,
 * it just won't roll over into a new cycle.
 */
export async function cancelSubscription(userId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("clerk_user_id", userId);
  if (error) throw new Error(error.message);
}

/** Undoes a pending cancellation, as long as the period hasn't ended yet. */
export async function resumeSubscription(userId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
    .eq("clerk_user_id", userId);
  if (error) throw new Error(error.message);
}

/**
 * Atomically deducts credits if the user has enough remaining. Returns
 * false (no charge applied) if there's no active subscription or not
 * enough credits left.
 */
export async function consumeCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const sub = await getSubscription(userId);
  if (!sub || sub.creditsRemaining < amount) return false;

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      credits_used: round1(sub.creditsUsed + amount),
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", userId)
    .eq("credits_used", sub.creditsUsed) // optimistic concurrency guard
    .select()
    .maybeSingle();

  return !error && !!data;
}

/**
 * Refunds credits after a generation fails — charges happen up front
 * (before the fal.ai call), so a failed job must give the credit back
 * rather than leave the user permanently out that amount. No-ops if the
 * subscription is gone (e.g. it fully expired in the meantime); clamps at
 * 0 so it can never push usage negative.
 */
export async function refundCredits(userId: string, amount: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const sub = await getSubscription(userId);
  if (!sub) return;

  await supabase
    .from("subscriptions")
    .update({
      credits_used: round1(Math.max(0, sub.creditsUsed - amount)),
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", userId)
    .eq("credits_used", sub.creditsUsed); // optimistic concurrency guard
}
