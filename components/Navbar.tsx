"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Home, CreditCard, LayoutDashboard } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { AccountSubscriptionPage } from "@/components/AccountSubscriptionPage";

const BASE_NAV_ITEMS = [
  { name: "Anasayfa", url: "/", icon: Home },
  { name: "Fiyatlandırma", url: "/pricing", icon: CreditCard },
];

export function Navbar() {
  const { isSignedIn } = useUser();

  const navItems = isSignedIn
    ? [...BASE_NAV_ITEMS, { name: "Panel", url: "/dashboard", icon: LayoutDashboard }]
    : BASE_NAV_ITEMS;

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 32 32"
            className="shrink-0"
            aria-hidden
          >
            <rect width="32" height="32" rx="8" fill="var(--ink)" />
            <path d="M10 11 L15 16 L10 21" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 11 L21 16 L16 21" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.62" />
            <path d="M22 11 L27 16 L22 21" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.32" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
            UGCBeam
          </span>
        </Link>

        <Show when="signed-in">
          <UserButton>
            <UserButton.UserProfilePage
              label="Abonelik"
              url="subscription"
              labelIcon={<CreditCard size={16} />}
            >
              <AccountSubscriptionPage />
            </UserButton.UserProfilePage>
          </UserButton>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="pill-black rounded-full px-4 py-1.5 text-[13px] font-medium">
              Giriş yap
            </button>
          </SignInButton>
        </Show>
      </div>

      <NavBar items={navItems} />
    </>
  );
}
