import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.trim().startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});

const generationId = "a86311c3-d6b4-4d2c-baf0-ac27e4081b02";
const videoResultUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_3B0AkaqC99txsxY3dwCYmtCKI1Q/hf_20260817_144022_ddb0b3ec-3c20-40c9-91a7-dac2ac5a1c9f.mp4";

const res = await fetch(videoResultUrl);
const buf = new Uint8Array(await res.arrayBuffer());
console.log("downloaded video bytes:", buf.length);

const path = `${generationId}/0.mp4`;
const { error: upErr } = await sb.storage.from("generated-videos").upload(path, buf, {
  contentType: "video/mp4",
  upsert: true,
});
if (upErr) { console.error("upload error:", upErr.message); process.exit(1); }

const { data: pub } = sb.storage.from("generated-videos").getPublicUrl(path);
console.log("public url:", pub.publicUrl);

await sb.from("generation_videos")
  .update({ status: "completed", video_url: pub.publicUrl })
  .eq("generation_id", generationId)
  .eq("script_index", 0);

await sb.from("generation_videos")
  .update({ status: "failed" })
  .eq("generation_id", generationId)
  .in("script_index", [1, 2]);

await sb.from("generations")
  .update({ status: "completed" })
  .eq("id", generationId);

console.log("done");
