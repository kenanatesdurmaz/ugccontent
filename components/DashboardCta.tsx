"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Client-side <Link href="/dashboard"> navigations don't reliably hit the
 * proxy.ts redirect-to-sign-in when signed out (confirmed: direct/hard nav
 * to /dashboard correctly 307s to /sign-in, but a soft nav via next/link
 * silently lands back on "/"). Gate it explicitly here instead of relying
 * on middleware for this specific transition.
 */
export function DashboardCta({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Link href="/dashboard" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
      <button className={className}>{children}</button>
    </SignInButton>
  );
}
