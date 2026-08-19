import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { DialogProvider } from "@/components/DialogProvider";
import { authLocalization } from "@/lib/clerk-appearance";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UGCBeam — AI UGC Ad Videos",
  description: "Turn a product photo into scroll-stopping UGC ad videos in minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      localization={authLocalization}
      appearance={{
        variables: {
          colorPrimary: "#0071e3",
          colorBackground: "#ffffff",
          fontFamily: "var(--font-onest)",
          borderRadius: "12px",
        },
      }}
    >
      <html lang="en" className={`${onest.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-white text-[var(--ink)]">
          <DialogProvider>
            <Navbar />
            <div className="flex flex-1 flex-col pb-24 pt-16 sm:pb-0">{children}</div>
          </DialogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
