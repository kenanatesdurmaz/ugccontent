import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { DialogProvider } from "@/components/DialogProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthAnalytics } from "@/components/AuthAnalytics";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Applies the resolved theme before hydration/paint so there's no flash
// of the wrong theme — mirrors ThemeProvider's own resolution logic.
const themeInitScript = `(function(){try{var t=localStorage.getItem('ugcbeam_theme');var d=(t==='dark')||((t!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

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
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
          <GoogleAnalytics />
          <ThemeProvider>
            <LanguageProvider>
              <DialogProvider>
                <AuthAnalytics />
                <Navbar />
                <div className="flex flex-1 flex-col pb-24 pt-16 sm:pb-0">{children}</div>
              </DialogProvider>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
