import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthBackground } from "@/components/AuthBackground";
import { authAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthBackground>
      <div className="relative inline-block">
        <Link
          href="/sign-in"
          className="absolute right-8 top-8 z-10 text-[13px] font-semibold text-white transition-colors hover:text-white/80"
        >
          Giriş yap
        </Link>
        <SignUp appearance={authAppearance} />
      </div>
    </AuthBackground>
  );
}
