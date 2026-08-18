import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg-secondary)] py-20">
      <SignIn />
    </main>
  );
}
