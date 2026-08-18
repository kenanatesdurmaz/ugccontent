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
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)]">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
            UGCForge
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
