"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { trackEvent } from "@/lib/analytics";

const TRACKED_KEY = "ugcbeam_ga_auth_tracked";
// A Clerk account created within this window of "now" is treated as a
// fresh signup rather than a returning login — Clerk gives no other
// client-side signal to tell the two apart after a redirect-based flow.
const SIGNUP_WINDOW_MS = 2 * 60 * 1000;

/** Fires one GA4 signup/login event per browser tab session, once the signed-in user is known. */
export function AuthAnalytics() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || typeof window === "undefined") return;

    const trackedUserId = window.sessionStorage.getItem(TRACKED_KEY);
    if (trackedUserId === user.id) return;
    window.sessionStorage.setItem(TRACKED_KEY, user.id);

    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const justSignedUp = createdAt > 0 && Date.now() - createdAt < SIGNUP_WINDOW_MS;

    trackEvent(justSignedUp ? "signup" : "login", { method: "clerk" });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
