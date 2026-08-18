import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscription, resumeSubscription } from "@/lib/subscription-server";

/** Undoes a pending cancel-at-period-end, as long as the period hasn't ended yet. */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getSubscription(userId);
  if (!existing) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  await resumeSubscription(userId);
  return NextResponse.json({ ok: true });
}
