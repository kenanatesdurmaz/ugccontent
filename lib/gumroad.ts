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
 * Extra permalink -> plan aliases, for products whose checkout URL slug
 * (above) doesn't match the permalink Gumroad's Sales API actually reports
 * for `product_permalink`. Confirmed via a real "Send test ping": Starter's
 * checkout link reads "/l/Starter" but the sale itself still reports the
 * original auto-generated "fzjfi" permalink.
 */
const PERMALINK_ALIASES: Partial<Record<PlanId, string[]>> = {
  starter: ["fzjfi"],
};

/** Reverse lookup: Gumroad product permalink (the `/l/<permalink>` slug) -> our plan id. */
const PERMALINK_TO_PLAN: Record<string, PlanId> = Object.fromEntries([
  ...Object.entries(GUMROAD_CHECKOUT_URLS)
    .filter(([, url]) => url)
    .map(([plan, url]) => [new URL(url).pathname.split("/").pop()!, plan as PlanId]),
  ...Object.entries(PERMALINK_ALIASES).flatMap(([plan, aliases]) =>
    aliases!.map((alias) => [alias, plan as PlanId])
  ),
]);

export function permalinkToPlan(permalink: string): PlanId | null {
  return PERMALINK_TO_PLAN[permalink] ?? null;
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
  product_permalink: string;
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
