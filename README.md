# UGCForge

Bir ürün fotoğrafı + ürün adından otomatik UGC reklam videoları üreten web
uygulaması. Video üretim pipeline'ı fal.ai üzerinden doğrudan bu uygulama
tarafından çalıştırılır (bkz. [lib/fal.ts](lib/fal.ts) ve
[app/api/generations/route.ts](app/api/generations/route.ts)) — ayrı bir
otomasyon aracına (n8n vb.) ihtiyaç yoktur.

## Kurulum

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` içine Clerk, Supabase ve `FAL_KEY` (bkz.
https://fal.ai/dashboard/keys) anahtarlarını gir (bkz.
[.env.local.example](.env.local.example)).

Supabase projende [supabase/schema.sql](supabase/schema.sql) dosyasını bir
kere çalıştır (tabloları ve storage bucket'larını oluşturur).

```bash
npm run dev
```

## Video üretim pipeline'ı

Formdan gönderim yapıldığında, `app/api/generations/route.ts` şu adımları
sırayla fal.ai'ye karşı çalıştırır:

1. **Açılış karesi** — `fal-ai/nano-banana/edit` modeline ürün fotoğrafı (ve
   varsa kullanıcının yüklediği avatar) referans olarak verilir; ürünün
   gerçek kullanım şekline uygun (elde tutmak değil, gerçekten kullanmak)
   doğal bir sahne üretilir.
2. **Video** — `fal-ai/kling-video/v3/turbo/pro/image-to-video` modeline bu
   kare `image_url` olarak verilir, 15 saniyelik, kullanıcının seçtiği
   `aspect_ratio` (16:9 / 9:16 / 1:1) ile video üretilir.
3. Sonuç video indirilip Supabase Storage'daki `generated-videos`
   bucket'ına yeniden yüklenir, `generation_videos` satırı ve ardından
   `generations.status` `completed` olarak işaretlenir.

Bu adımlar `fal.ai`'nin queue API'sini (submit → status poll → result)
kullanır ve `npm run dev` gibi uzun ömürlü bir process içinde çalışır — bkz.
`runFalPipeline` içindeki not: serverless bir deploy'da (örn. Vercel'de kısa
ömürlü function'lar) bunun yerine fal.ai'nin webhook teslimatına geçmek
gerekir.

## Proje yapısı

- `app/` — sayfalar (landing, pricing, dashboard, auth) ve API route'ları
- `components/` — form, kart, detay gibi client bileşenler
- `lib/` — Supabase client, fal.ai client, tipler
- `supabase/schema.sql` — veritabanı şeması + storage bucket'ları
