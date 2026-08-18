/**
 * Admins are listed by Clerk user ID via env var, not a DB role — there's
 * no user-management UI in this app, and this keeps the admin list out of
 * reach of anything client-controllable.
 */
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const admins = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return admins.includes(userId);
}
