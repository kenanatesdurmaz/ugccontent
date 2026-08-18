import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { DashboardCta } from "@/components/DashboardCta";

const examples = [
  { product: "/demo-product.jpg", video: "/demo-ugc.mp4" },
  { product: "/demo-product-2.webp", video: "/demo-ugc-2.mp4" },
  { product: "/demo-product-3.jpg", video: "/demo-ugc-3.mp4" },
];

const steps = [
  {
    n: "1",
    title: "Ürününü yükle",
    body: "Tek bir ürün fotoğrafı ve ürün adı yeterli. Başka hiçbir şeye gerek yok.",
  },
  {
    n: "2",
    title: "Senaryo yazılsın",
    body: "Ürününe uygun bir influencer personası ve UGC reklam senaryosu otomatik üretilir.",
  },
  {
    n: "3",
    title: "Videon hazır",
    body: "Dikey, gerçekçi bir UGC reklam videon birkaç dakika içinde panelinde belirir.",
  },
];

const features = [
  {
    title: "Stüdyo gerekmez",
    body: "Kamera, oyuncu, kurgu ekibi yok. Tek fotoğraf her şeyi başlatır.",
    icon: (
      <path
        d="M4 8.5 6.5 5h11L20 8.5M4 8.5v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-10M4 8.5h16M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Dakikalar içinde",
    body: "Ajanslarda günler süren süreç, burada birkaç dakikaya iniyor.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Dikey ve hazır format",
    body: "9:16, TikTok / Reels / Shorts'a doğrudan yüklenebilecek şekilde üretilir.",
    icon: (
      <rect x="7" y="3.5" width="10" height="17" rx="2.2" strokeLinejoin="round" />
    ),
  },
  {
    title: "Gerçek hissettirir",
    body: "Reklam gibi değil, gerçek bir kullanıcının paylaşımı gibi görünür.",
    icon: (
      <path
        d="M12 20.5s-7-4.35-9-8.5c-1.4-2.9.2-6 3.2-6.4 2-.28 3.3.75 4.3 2.1 1-1.35 2.3-2.38 4.3-2.1 3 .4 4.6 3.5 3.2 6.4-2 4.15-9 8.5-9 8.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const stats = [
  { value: "1", unit: "fotoğraf", label: "girdi olarak yeterli" },
  { value: "~3", unit: "dakika", label: "ortalama üretim süresi" },
  { value: "9:16", unit: "format", label: "dikey, platforma hazır" },
];

const faqs = [
  {
    q: "UGC (kullanıcı tarafından üretilmiş içerik) nedir?",
    a: "Gerçek bir kişinin elindeki telefonla, samimi ve reklam gibi hissettirmeyen bir dille çektiği tanıtım videosudur. Marka içeriklerinden çok daha güvenilir bulunur ve daha yüksek etkileşim alır.",
  },
  {
    q: "Videoyu ne kadar sürede alırım?",
    a: "Ürün fotoğrafını yükleyip gönderdikten sonra ortalama birkaç dakika içinde video panelinde hazır olur. Süreci beklerken sayfadan ayrılabilirsin, tamamlandığında panelde göreceksin.",
  },
  {
    q: "Kendi ürün fotoğrafımı kullanabilir miyim?",
    a: "Evet. Tek ihtiyacın olan, ürününü net gösteren bir fotoğraf. İstersen ek bir yönlendirme metni de ekleyebilirsin, eklemesen de sistem senaryoyu otomatik oluşturur.",
  },
  {
    q: "Üretilen videoyu nerede kullanabilirim?",
    a: "Video 9:16 dikey formatta üretildiği için TikTok, Instagram Reels, YouTube Shorts gibi platformlara doğrudan yüklenebilir; reklam kreatifi olarak da kullanılabilir.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center px-6 pt-20 pb-16 text-center sm:pt-28">
        <span className="reveal mb-5 rounded-full bg-[var(--bg-secondary)] px-4 py-1.5 text-[13px] font-medium text-[var(--ink-secondary)]">
          Yapay zeka ile UGC reklam videosu üretimi
        </span>

        <h1
          className="reveal max-w-4xl text-[clamp(2.6rem,7vw,5.25rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--ink)]"
          style={{ animationDelay: "0.08s" }}
        >
          Tek fotoğraftan
          <br />
          <span className="text-[var(--accent)]">gerçekçi UGC</span> videosu
        </h1>

        <p
          className="reveal mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-secondary)]"
          style={{ animationDelay: "0.16s" }}
        >
          Ürün fotoğrafını yükle, adını yaz — geri kalanını yapay zeka
          hallesin. Senaryo, karakter ve video üretimi tamamen otomatik.
        </p>

        <div
          className="reveal mt-9 flex flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.24s" }}
        >
          <DashboardCta className="pill-black rounded-full px-7 py-3 text-[15px] font-medium">
            Ücretsiz dene
          </DashboardCta>
          <Link
            href="/pricing"
            className="flex items-center gap-1 rounded-full px-7 py-3 text-[15px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Fiyatlandırmayı gör
            <span aria-hidden>›</span>
          </Link>
        </div>

        <div
          className="reveal mt-16 flex w-full max-w-5xl flex-col items-center gap-12 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-10"
          style={{ animationDelay: "0.32s" }}
        >
          {examples.map((example, i) => (
            <div
              key={example.video}
              className="flex flex-col items-center gap-6 sm:flex-row"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-[13px] font-medium text-[var(--ink-tertiary)]">
                  Ürün fotoğrafı
                </span>
                <div className="card-shadow h-40 w-40 overflow-hidden rounded-3xl bg-[var(--bg-secondary)] sm:h-48 sm:w-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={example.product}
                    alt="Örnek ürün fotoğrafı"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <span className="hidden text-3xl text-[var(--ink-tertiary)] sm:inline">
                ›
              </span>
              <span className="text-2xl text-[var(--ink-tertiary)] sm:hidden">
                ⌄
              </span>

              <div className="flex flex-col items-center gap-3">
                <span className="text-[13px] font-medium text-[var(--ink-tertiary)]">
                  UGC reklam videosu
                </span>
                <div className="card-shadow relative aspect-[9/16] w-40 overflow-hidden rounded-3xl bg-black sm:w-48">
                  <video
                    src={example.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {i < examples.length - 1 && (
                <div
                  className="my-4 h-px w-24 bg-[var(--line)] sm:my-0 sm:h-24 sm:w-px"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>

        <p
          className="reveal mt-8 max-w-md text-[13px] text-[var(--ink-tertiary)]"
          style={{ animationDelay: "0.4s" }}
        >
          UGC (kullanıcı tarafından üretilmiş içerik), gerçek bir kişinin
          elindeki telefonla, samimi ve reklam gibi hissettirmeyen bir dille
          çektiği tanıtım videosudur — yukarıdaki gerçek bir çıktı örneğidir.
        </p>
      </section>

      {/* Stats band */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-tertiary)] py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 px-6 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 100}>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[clamp(2.4rem,5vw,3.25rem)] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  {stat.value}
                  <span className="ml-1.5 text-lg font-medium text-[var(--ink-tertiary)]">
                    {stat.unit}
                  </span>
                </span>
                <span className="text-[13px] text-[var(--ink-secondary)]">
                  {stat.label}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-[var(--bg-secondary)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <h2 className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Üç adımda, dakikalar içinde
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <ScrollReveal key={step.n} delay={i * 120}>
                <div className="card-shadow flex h-full flex-col gap-4 rounded-3xl bg-white p-8">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-[15px] font-semibold text-white">
                    {step.n}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
                    {step.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <h2 className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Neden UGCForge
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 90}>
                <div className="flex h-full flex-col gap-4 rounded-3xl bg-[var(--bg-secondary)] p-7">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    className="h-7 w-7"
                  >
                    {feature.icon}
                  </svg>
                  <h3 className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">
                    {feature.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                    {feature.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--bg-secondary)] py-24">
        <div className="mx-auto max-w-2xl px-6">
          <ScrollReveal>
            <h2 className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Sık sorulan sorular
            </h2>
          </ScrollReveal>

          <div className="mt-12 flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 70}>
                <details className="faq-item card-shadow rounded-2xl bg-white px-6 py-5">
                  <summary className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-medium text-[var(--ink)]">
                      {faq.q}
                    </span>
                    <span className="faq-icon flex h-6 w-6 shrink-0 items-center justify-center text-xl font-light text-[var(--ink-tertiary)]">
                      +
                    </span>
                  </summary>
                  <div className="faq-body">
                    <div>
                      <p className="pt-4 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--ink)] py-24">
        <ScrollReveal className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold tracking-[-0.03em] text-white">
            İlk videonu bugün oluştur
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-white/60">
            Kredi kartı gerekmez. Bir ürün fotoğrafı yükle, gerisini yapay
            zekaya bırak.
          </p>
          <DashboardCta className="rounded-full bg-white px-7 py-3 text-[15px] font-medium text-[var(--ink)] transition-transform hover:scale-[1.03] active:scale-[0.98]">
            Ücretsiz dene
          </DashboardCta>
        </ScrollReveal>
      </section>
    </main>
  );
}
