import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  const { userId } = await auth();

  if (!isAdminUser(userId)) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
          No access
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          You need admin access to view this page.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <div className="mb-8">
        <h1 className="text-[clamp(1.9rem,4vw,2.75rem)] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          Admin
        </h1>
        <p className="mt-2 text-[var(--ink-secondary)]">
          Emergency kill switch, test/live mode, and recent generation logs for video generation.
        </p>
      </div>
      <AdminPanel />
    </main>
  );
}
