import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  // Normalize every upload to JPEG server-side. fal.ai's image models
  // (nano-banana/edit in particular) silently fail on some formats browsers
  // commonly produce (e.g. .avif) — the queue job reports COMPLETED but its
  // result body comes back unparseable. Converting once at upload time
  // avoids that for every downstream generation.
  const inputBytes = new Uint8Array(await file.arrayBuffer());
  const jpegBytes = await sharp(inputBytes).jpeg({ quality: 92 }).toBuffer();

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, jpegBytes, { contentType: "image/jpeg", upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
