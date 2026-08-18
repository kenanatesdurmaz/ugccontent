import type { PlanId } from "@/lib/plans";

const JUST_SUBSCRIBED_KEY = "ugcforge_just_subscribed";
const PENDING_PLAN_KEY = "ugcforge_pending_plan";

/** Marks that the user just subscribed, for a one-time "welcome" toast. */
export function markJustSubscribed() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(JUST_SUBSCRIBED_KEY, "true");
}

/** Reads and clears the just-subscribed flag — call once, on the page that shows the toast. */
export function consumeJustSubscribed(): boolean {
  if (typeof window === "undefined") return false;
  const value = window.sessionStorage.getItem(JUST_SUBSCRIBED_KEY) === "true";
  window.sessionStorage.removeItem(JUST_SUBSCRIBED_KEY);
  return value;
}

/**
 * Remembers which plan a signed-out user picked on /pricing so it can be
 * applied (via POST /api/subscribe) once they land on /dashboard after
 * completing sign-in — the subscribe call itself needs an authenticated
 * request, which isn't available yet at the moment they click.
 */
export function setPendingPlan(plan: PlanId) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_PLAN_KEY, plan);
}

export function consumePendingPlan(): PlanId | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(PENDING_PLAN_KEY) as PlanId | null;
  window.sessionStorage.removeItem(PENDING_PLAN_KEY);
  return value;
}
