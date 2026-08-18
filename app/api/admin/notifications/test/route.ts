import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { getAppSettings } from "@/lib/app-settings-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deliverNotification } from "@/lib/admin-notifications-server";

/**
 * Sends a real email to ADMIN_EMAIL using sample data, without any
 * subscription or payment happening — lets the admin verify the mail
 * pipeline works. Only usable while the site is in TEST MODE, so it can
 * never be triggered against a live production subscribe flow.
 */
export async function POST() {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getAppSettings();
  if (settings.mode !== "test") {
    return NextResponse.json(
      { error: "Test notifications can only be sent while in TEST MODE" },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("admin_notifications")
    .insert({
      event_id: `test_${crypto.randomUUID()}`,
      event_type: "test",
      clerk_user_id: userId,
      payload: {
        userEmail: "test-user@example.com",
        plan: "creator",
        amount: "$36.99",
        creditsGranted: 130,
        startedAt: now.toISOString(),
        renewsAt: renewsAt.toISOString(),
        transactionId: `test_${crypto.randomUUID()}`,
      },
    })
    .select()
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to queue test notification" }, { status: 500 });
  }

  await deliverNotification(data.id);
  return NextResponse.json({ ok: true });
}
