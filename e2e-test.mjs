import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.trim().startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});

const { data: gen, error } = await sb.from("generations").insert({
  clerk_user_id: "e2e_test_user",
  product_name: "Lavanta Aromalı Uyku Spreyi",
  product_image_url: "https://picsum.photos/seed/ugcproduct2/800/800",
  custom_prompt: "sakin, güven veren bir ton",
  status: "processing",
}).select().single();

if (error) { console.error("DB insert failed:", error.message); process.exit(1); }

await sb.from("generation_videos").insert(
  [0,1,2].map(i => ({ generation_id: gen.id, script_index: i, status: "pending" }))
);

console.log("generationId:", gen.id);

const res = await fetch(env.N8N_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    generationId: gen.id,
    productName: gen.product_name,
    productImageUrl: gen.product_image_url,
    customPrompt: gen.custom_prompt,
  }),
});
console.log("n8n webhook:", res.status, await res.text());
