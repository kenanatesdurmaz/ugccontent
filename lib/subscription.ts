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

/**
 * Opens Gumroad checkout in a new tab and polls our own /api/subscription
 * in the background until it changes — that's the signal the verified
 * webhook actually granted credit for a completed payment, since Gumroad
 * itself gives us no reliable "purchase finished" redirect. Once detected,
 * closes the checkout tab and reloads /dashboard so the new credits and
 * the "Abone olundu" toast show up without the user doing anything.
 *
 * `onGiveUp` fires if the tab gets closed (or after a 5-minute cap) with
 * no change detected — e.g. the user backed out without paying — so the
 * caller can reset any "waiting" UI state.
 */
export function openCheckoutAndWatch(url: string, onGiveUp?: () => void) {
  if (typeof window === "undefined") return;
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    onGiveUp?.();
    return;
  }

  const deadline = Date.now() + 5 * 60 * 1000;
  let baseline: string | null = null;

  const tick = async () => {
    if (popup.closed || Date.now() > deadline) {
      onGiveUp?.();
      return;
    }
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const { subscription } = await res.json();
        const snapshot = JSON.stringify(subscription);
        if (baseline === null) {
          baseline = snapshot;
        } else if (snapshot !== baseline) {
          popup.close();
          markJustSubscribed();
          window.location.href = "/dashboard";
          return;
        }
      }
    } catch {
      // transient network hiccup — just keep polling
    }
    setTimeout(tick, 3000);
  };

  tick();
}
