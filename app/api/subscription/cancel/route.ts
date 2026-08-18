import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cancelSubscription, getSubscription } from "@/lib/subscription-server";

/**
 * Cancels at the end of the current period rather than immediately — the
 * user already paid for it, so their plan and remaining credits stay
 * usable until `renews_at`.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getSubscription(userId);
  if (!existing) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  await cancelSubscription(userId);
  return NextResponse.json({ ok: true });
}
