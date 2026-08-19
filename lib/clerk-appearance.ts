// Shared Clerk appearance for the sign-in/sign-up "glass card" look: a
// frosted, translucent card that sits on top of AuthBackground.
//
// Clerk's own injected styles carry higher CSS specificity than a plain
// Tailwind utility class appended via `elements`, so anything overriding a
// property Clerk itself sets (background, border, radius, shadow, display)
// needs the `!` (important) Tailwind modifier to actually win — verified by
// inspecting computed styles in the browser, not by assumption.
export const authAppearance = {
  variables: {
    colorPrimary: "#0071e3",
    colorBackground: "transparent",
    colorInputBackground: "rgba(0,0,0,0.4)",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.7)",
    fontFamily: "var(--font-onest)",
    borderRadius: "16px",
  },
  options: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  elements: {
    rootBox: "w-full max-w-sm",
    cardBox: "!w-full !shadow-none !bg-transparent",
    card: "!relative !w-full !rounded-[28px] !border !border-white/15 !bg-white/10 !p-8 !shadow-[0_20px_60px_rgba(0,0,0,0.35)] !backdrop-blur-2xl",
    header: "!items-start !pr-20 !text-left",
    headerTitle: "!text-left !text-xl !font-semibold !text-white",
    headerSubtitle: "!text-left !text-[13px] !text-white/70",
    footer: "!hidden",
    dividerRow: "!hidden",
    formFieldLabelRow: "!mb-1.5",
    formFieldLabel: "!text-[13px] !font-semibold !text-white",
    formFieldAction: "!text-[13px] !font-medium !text-white/70 hover:!text-white",
    formFieldInput:
      "!rounded-xl !border !border-white/10 !bg-black/40 !px-4 !py-2.5 !text-white placeholder:!text-white/35 focus:!border-white/30 focus:!ring-1 focus:!ring-white/30",
    formFieldInputShowPasswordIcon: "!text-white/50 hover:!text-white/80",
    formButtonPrimary:
      "!mt-2 !rounded-full !bg-white !px-5 !py-3 !text-[15px] !font-medium !normal-case !text-[#1d1d1f] !shadow-none hover:!bg-white/90",
    socialButtonsBlockButton:
      "!border-0 !bg-transparent !px-0 !text-[14px] !font-medium !text-white hover:!bg-white/5",
    socialButtonsBlockButtonText: "!text-white",
    identityPreviewText: "!text-white",
    identityPreviewEditButtonIcon: "!text-white/70",
    formResendCodeLink: "!text-white",
    otpCodeFieldInput: "!border-white/10 !bg-black/40 !text-white",
  },
};
