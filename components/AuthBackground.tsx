import type { ReactNode } from "react";

/**
 * Soft, blurred sky-blue backdrop the glass auth cards float on — built from
 * layered gradients so no external image asset is needed.
 */
export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20">
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(135deg, #cfe8fa 0%, #eef6fb 30%, #a9d0ec 65%, #5f9fd1 100%)",
        }}
      />
      <div
        className="absolute -inset-32 -z-10 opacity-80 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.95), transparent 42%), radial-gradient(circle at 82% 28%, rgba(120,180,224,0.9), transparent 46%), radial-gradient(circle at 50% 85%, rgba(60,110,160,0.85), transparent 55%)",
        }}
      />
      {children}
    </main>
  );
}
