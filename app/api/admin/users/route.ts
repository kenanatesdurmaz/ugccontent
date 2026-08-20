import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Signed-up users with their emails, for admin oversight. Emails live in
 * Clerk (auth), not Supabase (which only ever stores clerk_user_id) — this
 * fetches the user list from Clerk's Backend API and enriches it with each
 * user's subscription state from Supabase.
 */
export async function GET() {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();
  const { data: users, totalCount } = await client.users.getUserList({
    limit: 200,
    orderBy: "-created_at",
  });

  const supabase = getSupabaseAdmin();
  const clerkIds = users.map((u) => u.id);
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("clerk_user_id, plan, credits_granted, credits_used, cancel_at_period_end")
    .in("clerk_user_id", clerkIds.length > 0 ? clerkIds : [""]);

  const subsByUser = new Map((subs ?? []).map((s) => [s.clerk_user_id, s]));

  const rows = users.map((u) => {
    const primaryEmail =
      u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      null;
    const sub = subsByUser.get(u.id);
    return {
      id: u.id,
      email: primaryEmail,
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
      plan: sub?.plan ?? null,
      creditsUsed: sub ? Number(sub.credits_used) : null,
      creditsGranted: sub ? Number(sub.credits_granted) : null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? null,
    };
  });

  return NextResponse.json({ users: rows, totalCount });
}
