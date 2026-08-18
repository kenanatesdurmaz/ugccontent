import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/mail";
import { PLANS, type PlanId } from "@/lib/plans";

export type SubscriptionEventPayload = {
  userEmail: string;
  plan: PlanId;
  amount: string;
  creditsGranted: number;
  startedAt: string;
  renewsAt: string;
  transactionId: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function buildSubscriptionEmailHtml(payload: SubscriptionEventPayload, isTest: boolean) {
  const planName = PLANS[payload.plan]?.name ?? payload.plan;
  return `
    <h2>${isTest ? "[TEST] " : ""}Yeni abonelik bildirimi</h2>
    <table cellpadding="4" cellspacing="0">
      <tr><td><strong>Kullanıcı e-postası</strong></td><td>${payload.userEmail}</td></tr>
      <tr><td><strong>Satın alınan paket</strong></td><td>${planName}</td></tr>
      <tr><td><strong>Ödenen tutar</strong></td><td>${payload.amount}</td></tr>
      <tr><td><strong>Tanımlanan AI video kredisi</strong></td><td>${payload.creditsGranted}</td></tr>
      <tr><td><strong>Abonelik başlangıç tarihi</strong></td><td>${formatDate(payload.startedAt)}</td></tr>
      <tr><td><strong>Sonraki yenilenme tarihi</strong></td><td>${formatDate(payload.renewsAt)}</td></tr>
      <tr><td><strong>Ödeme/transaction ID</strong></td><td>${payload.transactionId}</td></tr>
    </table>
    ${isTest ? "<p><em>Bu bir test bildirimidir, gerçek bir ödeme temsil etmez.</em></p>" : ""}
  `;
}

/**
 * Sends (or retries) the email for one already-recorded notification row.
 * Never throws — a failed send is recorded on the row (status/last_error)
 * instead, so it can be retried later without ever affecting the
 * subscription/credits that were already committed.
 */
export async function deliverNotification(notificationId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: notification } = await supabase
    .from("admin_notifications")
    .select("*")
    .eq("id", notificationId)
    .maybeSingle();

  if (!notification || notification.status === "sent") return;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("ADMIN_EMAIL is not set — cannot deliver admin notification", notificationId);
    await supabase
      .from("admin_notifications")
      .update({
        status: "failed",
        attempts: notification.attempts + 1,
        last_error: "ADMIN_EMAIL env var is not set",
      })
      .eq("id", notificationId);
    return;
  }

  const isTest = notification.event_type === "test";
  const payload = notification.payload as SubscriptionEventPayload;

  try {
    await sendEmail({
      to: adminEmail,
      subject: isTest ? "[TEST] Yeni abonelik bildirimi" : "Yeni abonelik bildirimi",
      html: buildSubscriptionEmailHtml(payload, isTest),
    });
    await supabase
      .from("admin_notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        attempts: notification.attempts + 1,
        last_error: null,
      })
      .eq("id", notificationId);
  } catch (err) {
    console.error("Admin notification email failed", err);
    await supabase
      .from("admin_notifications")
      .update({
        status: "failed",
        attempts: notification.attempts + 1,
        last_error: err instanceof Error ? err.message : String(err),
      })
      .eq("id", notificationId);
  }
}

/**
 * Records a subscription-created event and fires the admin email.
 * `eventId` must be a value generated server-side from a durably
 * committed outcome (never something a client can influence) — a unique
 * DB constraint on it makes this idempotent, so calling it twice for the
 * same event is a safe no-op (second call just skips, no second email).
 */
export async function notifySubscriptionCreated(
  eventId: string,
  clerkUserId: string,
  payload: SubscriptionEventPayload
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_notifications")
    .insert({
      event_id: eventId,
      event_type: "subscription_created",
      clerk_user_id: clerkUserId,
      payload,
    })
    .select()
    .maybeSingle();

  if (error) {
    // Unique violation on event_id = this event was already recorded
    // (and already emailed, or is being sent) — idempotent no-op.
    if (error.code === "23505") return;
    console.error("Failed to record admin notification", error);
    return;
  }
  if (!data) return;

  // Fire-and-forget: email delivery must never block or fail the
  // subscribe request that already succeeded.
  deliverNotification(data.id);
}
