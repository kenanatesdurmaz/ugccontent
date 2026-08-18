import { PlanCta } from "@/components/PlanCta";
import { PLANS, CREDIT_COST_15S, max1080pVideos } from "@/lib/plans";

const plans = [
  {
    id: PLANS.starter.id,
    name: PLANS.starter.name,
    price: PLANS.starter.price,
    tagline: "Küçük markalar ve bağımsız satıcılar için",
    features: [
      `Ayda ${PLANS.starter.credits} AI video kredisi`,
      `720p video (15 sn): ${CREDIT_COST_15S["720p"]} kredi`,
      `1080p video (15 sn): ${CREDIT_COST_15S["1080p"]} kredi`,
      `Maksimum ${max1080pVideos(PLANS.starter.credits)} adet 1080p video/ay`,
    ],
    cta: "Abone ol",
    highlighted: false,
  },
  {
    id: PLANS.creator.id,
    name: PLANS.creator.name,
    price: PLANS.creator.price,
    tagline: "Büyüyen markalar için",
    features: [
      `Ayda ${PLANS.creator.credits} AI video kredisi`,
      `720p video (15 sn): ${CREDIT_COST_15S["720p"]} kredi`,
      `1080p video (15 sn): ${CREDIT_COST_15S["1080p"]} kredi`,
      `Maksimum ${max1080pVideos(PLANS.creator.credits)} adet 1080p video/ay`,
      "Öncelikli video işleme",
    ],
    cta: "Abone ol",
    highlighted: true,
    badge: "En Popüler",
  },
  {
    id: PLANS.pro.id,
    name: PLANS.pro.name,
    price: PLANS.pro.price,
    tagline: "Ölçeklenen e-ticaret ekipleri için",
    features: [
      `Ayda ${PLANS.pro.credits} AI video kredisi`,
      `720p video (15 sn): ${CREDIT_COST_15S["720p"]} kredi`,
      `1080p video (15 sn): ${CREDIT_COST_15S["1080p"]} kredi`,
      `Maksimum ${max1080pVideos(PLANS.pro.credits)} adet 1080p video/ay`,
      "Öncelikli video işleme",
      "Takım üyeleri ekleme",
    ],
    cta: "Abone ol",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-24">
      <div className="text-center">
        <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] font-semibold tracking-[-0.03em] text-[var(--ink)]">
          Basit, şeffaf fiyatlandırma
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--ink-secondary)]">
          Video üretmek için bir plana abone olman gerekir. Kredilerin
          süreye göre kullanılır — istediğin süre ve çözünürlükte üret.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card-shadow flex flex-col gap-6 rounded-3xl p-8 ${
              plan.highlighted
                ? "bg-[var(--ink)] text-white"
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
                /ay
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
                  ? "bg-white text-[var(--ink)] hover:bg-white/90"
                  : "bg-[var(--ink)] text-white hover:bg-black"
              }`}
              activeClassName={`rounded-full px-5 py-3 text-[14px] font-medium ${
                plan.highlighted ? "bg-white/15 text-white" : "bg-white text-[var(--ink)]"
              }`}
            >
              {plan.cta}
            </PlanCta>
          </div>
        ))}
      </div>
    </main>
  );
}
