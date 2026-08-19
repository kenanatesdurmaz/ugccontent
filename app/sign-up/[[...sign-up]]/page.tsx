"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthBackground } from "@/components/AuthBackground";
import { authAppearance } from "@/lib/clerk-appearance";
import { useLanguage } from "@/components/LanguageProvider";

export default function SignUpPage() {
  const { t } = useLanguage();

  return (
    <AuthBackground>
      <div className="relative inline-block">
        <Link
          href="/sign-in"
          className="absolute right-8 top-8 z-10 text-[13px] font-semibold text-white transition-colors hover:text-white/80"
        >
          {t.auth.signInLink}
        </Link>
        <SignUp appearance={authAppearance} />
      </div>
    </AuthBackground>
  );
}
