"use client";

import { PlanCta } from "@/components/PlanCta";
import { PLANS, CREDIT_COST_15S, max1080pVideos } from "@/lib/plans";
import { useLanguage } from "@/components/LanguageProvider";

export default function PricingPage() {
  const { t } = useLanguage();
  const { pricing } = t;

  const plans = [
    {
      id: PLANS.starter.id,
      name: PLANS.starter.name,
      price: PLANS.starter.price,
      tagline: pricing.taglineStarter,
      features: [
        pricing.creditsPerMonth(PLANS.starter.credits),
        pricing.cost720p(CREDIT_COST_15S["720p"]),
        pricing.cost1080p(CREDIT_COST_15S["1080p"]),
        pricing.max1080p(max1080pVideos(PLANS.starter.credits)),
      ],
      highlighted: false,
    },
    {
      id: PLANS.creator.id,
      name: PLANS.creator.name,
      price: PLANS.creator.price,
      tagline: pricing.taglineCreator,
      features: [
        pricing.creditsPerMonth(PLANS.creator.credits),
        pricing.cost720p(CREDIT_COST_15S["720p"]),
        pricing.cost1080p(CREDIT_COST_15S["1080p"]),
        pricing.max1080p(max1080pVideos(PLANS.creator.credits)),
        pricing.priorityProcessing,
      ],
      highlighted: true,
      badge: pricing.mostPopular,
    },
    {
      id: PLANS.pro.id,
      name: PLANS.pro.name,
      price: PLANS.pro.price,
      tagline: pricing.taglinePro,
      features: [
        pricing.creditsPerMonth(PLANS.pro.credits),
        pricing.cost720p(CREDIT_COST_15S["720p"]),
        pricing.cost1080p(CREDIT_COST_15S["1080p"]),
        pricing.max1080p(max1080pVideos(PLANS.pro.credits)),
        pricing.priorityProcessing,
        pricing.teamMembers,
      ],
      highlighted: false,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-24">
      <div className="text-center">
        <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] font-semibold tracking-[-0.03em] text-[var(--ink)]">
          {pricing.heading}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--ink-secondary)]">
          {pricing.subtext}
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card-shadow flex flex-col gap-6 rounded-3xl p-8 ${
              plan.highlighted
                ? "bg-[var(--ink-fixed)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--ink)]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">
                  {plan.name}
                </h2>
                {plan.badge && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">
                    {plan.badge}
                  </span>
                )}
              </div>
              <p
                className={`mt-1 text-sm ${
                  plan.highlighted ? "text-white/70" : "text-[var(--ink-secondary)]"
                }`}
              >
                {plan.tagline}
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">
                {plan.price}
              </span>
              <span
                className={`text-sm ${
                  plan.highlighted ? "text-white/60" : "text-[var(--ink-tertiary)]"
                }`}
              >
                {pricing.perMonth}
              </span>
            </div>

            <ul className="flex flex-1 flex-col gap-2.5 text-[14px]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className={plan.highlighted ? "text-white" : "text-[var(--accent)]"}>
                    ✓
                  </span>
                  <span className={plan.highlighted ? "text-white/85" : "text-[var(--ink-secondary)]"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <PlanCta
              plan={plan.id}
              className={`rounded-full px-5 py-3 text-center text-[14px] font-medium transition-colors ${
                plan.highlighted
                  ? "bg-white text-[var(--ink-fixed)] hover:bg-white/90"
                  : "bg-[var(--ink-fixed)] text-white hover:bg-black"
              }`}
              activeClassName={`rounded-full px-5 py-3 text-[14px] font-medium ${
                plan.highlighted ? "bg-white/15 text-white" : "bg-[var(--bg-elevated)] text-[var(--ink)]"
              }`}
            >
              {pricing.cta}
            </PlanCta>
          </div>
        ))}
      </div>
    </main>
  );
}
