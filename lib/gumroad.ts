import type { PlanId } from "@/lib/plans";

/**
 * Gumroad checkout URL per plan. TODO: fill in Creator/Pro once those
 * products are published on Gumroad (Starter is live).
 */
export const GUMROAD_CHECKOUT_URLS: Record<PlanId, string> = {
  starter: "https://kenanate.gumroad.com/l/Starter",
  creator: "https://kenanate.gumroad.com/l/Creator",
  pro: "https://kenanate.gumroad.com/l/Pro",
};

/**
 * Gumroad product id (from GET /v2/products, the `id` field) per plan —
 * NOT the permalink. The permalink is unreliable: a sale's
 * `product_permalink` field reports the product's original/legacy slug
 * (e.g. "fzjfi", "kcdms") even after the custom permalink shown in the
 * checkout URL was changed to "Starter"/"Creator"/etc, so matching on it
 * broke twice. `product_id` is stable and matches the sale's `product_id`
 * field exactly.
 */
const PRODUCT_ID_TO_PLAN: Record<string, PlanId> = {
  "BNGAhUhzwGV_NkdQf4xigQ==": "starter",
  "idQ6iyZSrHB0TAFqMEhR_A==": "creator",
  "IXjFqjDwMNN7EJ5nb4Yt1w==": "pro",
};

export function productIdToPlan(productId: string): PlanId | null {
  return PRODUCT_ID_TO_PLAN[productId] ?? null;
}

/**
 * Builds the checkout URL a signed-in user is redirected to for a plan.
 * Pre-fills the buyer's email (verified: a real sale's payload has no
 * generic "url_params" passthrough field, so a made-up query param like
 * `user_id` is silently dropped) — the webhook instead maps a completed
 * sale back to a Clerk account by looking up this email server-side.
 */
export function getCheckoutUrl(plan: PlanId, email: string): string {
  const base = GUMROAD_CHECKOUT_URLS[plan];
  if (!base) throw new Error(`No Gumroad checkout URL configured for plan "${plan}"`);
  const url = new URL(base);
  url.searchParams.set("wanted", "true");
  url.searchParams.set("email", email);
  return url.toString();
}

export type GumroadSale = {
  sale_id: string;
  product_id: string;
  email: string;
  purchase_email?: string;
  price: number; // cents
  currency: string;
  subscription_id?: string;
  recurrence?: string;
  test?: boolean;
  [key: string]: unknown;
};

/**
 * Re-fetches a sale from Gumroad's own API using our access token, rather
 * than trusting the raw ping body — Gumroad pings aren't signed, so this
 * server-to-server round trip is what actually proves a ping is genuine.
 */
export async function verifyGumroadSale(saleId: string): Promise<GumroadSale> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) throw new Error("GUMROAD_ACCESS_TOKEN is not set");

  const res = await fetch(
    `https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}?access_token=${encodeURIComponent(token)}`
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Gumroad sale verification failed: ${JSON.stringify(data)}`);
  }
  return data.sale as GumroadSale;
}

export type GumroadSubscriber = {
  id: string;
  status:
    | "alive"
    | "payment_method_update_required"
    | "pending_cancellation"
    | "pending_failure"
    | "failed_payment"
    | "fixed_subscription_period_ended"
    | "cancelled";
  cancelled_at: string | null;
  ended_at: string | null;
  [key: string]: unknown;
};

/**
 * Re-fetches a subscriber from Gumroad's own API, same reasoning as
 * verifyGumroadSale — the "cancellation"/"subscription_restarted"
 * resource_subscription pings (see app/api/webhooks/gumroad/route.ts)
 * aren't signed either, so the raw POST body is only a "go check now"
 * trigger; this server-to-server call is what actually decides whether
 * the subscription is cancelled.
 */
export async function verifyGumroadSubscriber(subscriptionId: string): Promise<GumroadSubscriber> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) throw new Error("GUMROAD_ACCESS_TOKEN is not set");

  const res = await fetch(
    `https://api.gumroad.com/v2/subscribers/${encodeURIComponent(subscriptionId)}?access_token=${encodeURIComponent(token)}`
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Gumroad subscriber verification failed: ${JSON.stringify(data)}`);
  }
  // Gumroad's own docs key this singular object under the plural
  // "subscribers", not "subscriber" — verified against a real response.
  return data.subscribers as GumroadSubscriber;
}
