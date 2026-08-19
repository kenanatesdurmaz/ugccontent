"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { AuthBackground } from "@/components/AuthBackground";
import { authAppearance } from "@/lib/clerk-appearance";
import { useLanguage } from "@/components/LanguageProvider";

export default function SignInPage() {
  const { t } = useLanguage();

  return (
    <AuthBackground>
      <div className="relative inline-block">
        <Link
          href="/sign-up"
          className="absolute right-8 top-8 z-10 text-[13px] font-semibold text-white transition-colors hover:text-white/80"
        >
          {t.auth.signUpLink}
        </Link>
        <SignIn appearance={authAppearance} />
      </div>
    </AuthBackground>
  );
}
