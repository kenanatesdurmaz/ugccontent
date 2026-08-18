export type PlanId = "starter" | "creator" | "pro";
export type Resolution = "720p" | "1080p";

/** Reference cost for a full 15s video at each resolution. */
export const CREDIT_COST_15S: Record<Resolution, number> = {
  "720p": 10,
  "1080p": 13,
};

const REFERENCE_DURATION = 15;

/** Per-second credit rate, derived from the 15s reference cost. */
export const CREDIT_RATE_PER_SECOND: Record<Resolution, number> = {
  "720p": CREDIT_COST_15S["720p"] / REFERENCE_DURATION,
  "1080p": CREDIT_COST_15S["1080p"] / REFERENCE_DURATION,
};

/**
 * Actual credit cost for a given resolution + duration (seconds), rounded
 * to the nearest half-credit (e.g. 4.5, 6.5) rather than a whole number.
 */
export function creditCost(resolution: Resolution, durationSeconds: number) {
  const raw = CREDIT_RATE_PER_SECOND[resolution] * durationSeconds;
  return Math.max(0.5, Math.round(raw * 2) / 2);
}

/** Formats a credit amount without a trailing ".0" for whole numbers. */
export function formatCredits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    price: string;
    credits: number;
    popular?: boolean;
  }
> = {
  starter: { id: "starter", name: "Starter", price: "$19.99", credits: 65 },
  creator: {
    id: "creator",
    name: "Creator",
    price: "$36.99",
    credits: 130,
    popular: true,
  },
  pro: { id: "pro", name: "Pro", price: "$69.99", credits: 260 },
};

export function max1080pVideos(credits: number) {
  return Math.floor(credits / CREDIT_COST_15S["1080p"]);
}
