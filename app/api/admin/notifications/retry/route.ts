import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deliverNotification } from "@/lib/admin-notifications-server";

/** Re-attempts delivery for every notification that hasn't been sent yet. */
export async function POST() {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("admin_notifications")
    .select("id")
    .neq("status", "sent");

  await Promise.all((data ?? []).map((row) => deliverNotification(row.id)));

  return NextResponse.json({ retried: data?.length ?? 0 });
}
