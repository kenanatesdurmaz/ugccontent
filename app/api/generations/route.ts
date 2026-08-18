import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { submitFal, waitForFal } from "@/lib/fal";
import { creditCost } from "@/lib/plans";
import { consumeCredits, getSubscription, refundCredits } from "@/lib/subscription-server";
import { getAppSettings } from "@/lib/app-settings-server";

const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];
const RESOLUTIONS = ["720p", "1080p"] as const;
type Resolution = (typeof RESOLUTIONS)[number];
const MIN_DURATION = 3;
const MAX_DURATION = 15;

const FRAME_MODEL = "fal-ai/nano-banana/edit";
// "pro" outputs 1080p; "standard" outputs 720p and has no aspect_ratio
// param (it follows the input image's aspect ratio instead).
const VIDEO_MODEL_1080P = "fal-ai/kling-video/v3/turbo/pro/image-to-video";
const VIDEO_MODEL_720P = "fal-ai/kling-video/v3/turbo/standard/image-to-video";

// Local placeholder clips used to simulate a successful generation in test
// mode, so nothing ever hits fal.ai (or costs money) while testing.
const MOCK_VIDEO_URLS = ["/demo-ugc.mp4", "/demo-ugc-2.mp4", "/demo-ugc-3.mp4"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Global kill switch — checked before anything else (parsing, credits,
  // fal.ai) so a disabled admin toggle can never let a generation through.
  const settings = await getAppSettings();
  if (!settings.generationEnabled) {
    return NextResponse.json({ error: "generation_disabled" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const productName = body?.productName as string | undefined;
  const productImageUrl = body?.productImageUrl as string | undefined;
  const extraProductImageUrls = Array.isArray(body?.extraProductImageUrls)
    ? (body.extraProductImageUrls as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const customPrompt = (body?.customPrompt as string | undefined) || null;
  const avatarUrl = (body?.avatarUrl as string | undefined) || null;
  const aspectRatio = (body?.aspectRatio as string | undefined) || "9:16";
  const resolution = (body?.resolution as string | undefined) || "720p";
  const durationRaw = Number(body?.duration);
  const duration = Number.isFinite(durationRaw)
    ? Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(durationRaw)))
    : MAX_DURATION;

  if (!productName || !productImageUrl) {
    return NextResponse.json(
      { error: "productName and productImageUrl are required" },
      { status: 400 }
    );
  }

  if (!ASPECT_RATIOS.includes(aspectRatio as AspectRatio)) {
    return NextResponse.json({ error: "Invalid aspectRatio" }, { status: 400 });
  }

  if (!RESOLUTIONS.includes(resolution as Resolution)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  // There's no free tier — every generation requires an active
  // subscription and consumes credits (per-second rate, based on
  // resolution and the chosen duration). Credits are charged here, before
  // any fal.ai call is made — never call fal.ai first and check after.
  const subscription = await getSubscription(userId);
  if (!subscription) {
    return NextResponse.json(
      { error: "subscription_required" },
      { status: 403 }
    );
  }

  const cost = creditCost(resolution as Resolution, duration);
  const charged = await consumeCredits(userId, cost);
  if (!charged) {
    return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const supabase = getSupabaseAdmin();

  const { data: generation, error } = await supabase
    .from("generations")
    .insert({
      clerk_user_id: userId,
      product_name: productName,
      product_image_url: productImageUrl,
      extra_product_image_urls: extraProductImageUrls,
      custom_prompt: customPrompt,
      avatar_url: avatarUrl,
      aspect_ratio: aspectRatio,
      resolution,
      credit_cost: cost,
      status: "processing",
    })
    .select()
    .single();

  if (error || !generation) {
    // Generation record failed to create — nothing was ever queued, so
    // give the charged credits back.
    await refundCredits(userId, cost);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create generation" },
      { status: 500 }
    );
  }

  const { error: videosError } = await supabase
    .from("generation_videos")
    .insert({ generation_id: generation.id, script_index: 0, status: "pending" });

  if (videosError) {
    await refundCredits(userId, cost);
    return NextResponse.json({ error: videosError.message }, { status: 500 });
  }

  const pipelineOpts = {
    userId,
    creditCost: cost,
    productName,
    productImageUrl,
    extraProductImageUrls,
    avatarUrl,
    customPrompt,
    aspectRatio: aspectRatio as AspectRatio,
    resolution: resolution as Resolution,
    duration,
  };

  if (settings.mode === "test") {
    runMockPipeline(generation.id, pipelineOpts);
  } else {
    runFalPipeline(generation.id, pipelineOpts);
  }

  return NextResponse.json({ id: generation.id });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("generations")
    .select("*, generation_videos(*)")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ generations: data });
}

type PipelineOpts = {
  userId: string;
  creditCost: number;
  productName: string;
  productImageUrl: string;
  extraProductImageUrls: string[];
  avatarUrl: string | null;
  customPrompt: string | null;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: number;
};

async function markFailed(generationId: string, opts: PipelineOpts) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("generation_videos")
    .update({ status: "failed" })
    .eq("generation_id", generationId)
    .eq("script_index", 0);
  await supabase.from("generations").update({ status: "failed" }).eq("id", generationId);
  // Charged up front — a failed generation must not permanently cost the
  // user credits, so give it back.
  await refundCredits(opts.userId, opts.creditCost);
}

/**
 * Real generation pipeline, run directly against fal.ai (no n8n / mock
 * data). Fire-and-forget from the POST handler — relies on the Node
 * process staying alive between the response and completion, which holds
 * for `npm run dev` / a long-lived server, not serverless. A production
 * deploy should switch to fal.ai's webhook delivery instead of polling.
 */
async function runFalPipeline(generationId: string, opts: PipelineOpts) {
  const supabase = getSupabaseAdmin();

  try {
    const imageUrls = [
      ...(opts.avatarUrl ? [opts.avatarUrl] : []),
      opts.productImageUrl,
      ...opts.extraProductImageUrls,
    ];

    const framePrompt = `A natural, candid UGC-style photo of ${
      opts.avatarUrl ? "the person from the reference photo" : "a person"
    } actually using the product "${opts.productName}" in a realistic everyday setting, demonstrating how this specific type of product is normally used in real life (not just holding or posing with it — show the real action, e.g. applying/spraying/drinking/wearing/massaging in, whatever fits this product).${
      opts.extraProductImageUrls.length > 0
        ? " Use all the provided reference photos of the product (including its different angles/interior/details) to get the product's appearance accurately right."
        : ""
    } Shot on iPhone, ordinary flat everyday lighting, everything in sharp focus front to back — NOT a shallow depth-of-field / blurred-background professional photo, no bokeh, no studio look, looks like a real unedited phone snapshot.${
      opts.customPrompt ? ` ${opts.customPrompt}` : ""
    }`;

    const frameSubmit = await submitFal(FRAME_MODEL, {
      prompt: framePrompt,
      image_urls: imageUrls,
      aspect_ratio: opts.aspectRatio,
    });
    const frameResult = (await waitForFal(frameSubmit.status_url, frameSubmit.response_url)) as {
      images?: { url: string }[];
    };
    const frameUrl = frameResult.images?.[0]?.url;
    if (!frameUrl) {
      throw new Error("fal.ai frame generation returned no image");
    }

    const videoPrompt = `UGC-style selfie video shot on an iPhone front camera. The person continues naturally using "${opts.productName}" as shown in the starting frame, talking casually to the camera about it, natural hand and head movement, authentic unscripted customer-testimonial feel. Background stays in sharp focus the whole time — NOT a shallow depth-of-field / blurred-background cinematic shot, no bokeh, looks like a real unedited phone video, not AI-generated looking.`;

    const durationStr = String(opts.duration);
    const videoSubmit =
      opts.resolution === "1080p"
        ? await submitFal(VIDEO_MODEL_1080P, {
            prompt: videoPrompt,
            image_url: frameUrl,
            duration: durationStr,
            aspect_ratio: opts.aspectRatio,
          })
        : await submitFal(VIDEO_MODEL_720P, {
            prompt: videoPrompt,
            image_url: frameUrl,
            duration: durationStr,
          });

    // Log the fal.ai request id as soon as we have it, before waiting on
    // completion — so it's there for lookup even if the job later fails
    // or times out.
    await supabase
      .from("generations")
      .update({ fal_request_id: videoSubmit.request_id })
      .eq("id", generationId);

    const videoResult = (await waitForFal(videoSubmit.status_url, videoSubmit.response_url, {
      timeoutMs: 8 * 60 * 1000,
    })) as { video?: { url: string } };
    const falVideoUrl = videoResult.video?.url;
    if (!falVideoUrl) {
      throw new Error("fal.ai video generation returned no video");
    }

    // Re-host the video in our own Storage bucket rather than linking
    // fal.ai's CDN URL directly (keeps the app the source of truth and
    // avoids depending on fal.ai's URL retention policy).
    const videoBytes = new Uint8Array(await (await fetch(falVideoUrl)).arrayBuffer());
    const path = `${generationId}/0.mp4`;
    await supabase.storage
      .from("generated-videos")
      .upload(path, videoBytes, { contentType: "video/mp4", upsert: true });
    const { data: publicUrlData } = supabase.storage.from("generated-videos").getPublicUrl(path);

    await supabase
      .from("generation_videos")
      .update({ status: "completed", video_url: publicUrlData.publicUrl })
      .eq("generation_id", generationId)
      .eq("script_index", 0);
    await supabase.from("generations").update({ status: "completed" }).eq("id", generationId);
  } catch (err) {
    console.error("fal.ai pipeline failed", err);
    await markFailed(generationId, opts);
  }
}

/**
 * Test-mode stand-in for runFalPipeline: no fal.ai call, no API key
 * usage, no cost. Simulates the same async processing → completed/failed
 * shape (including the credit charge/refund path) so the rest of the app
 * can be exercised end-to-end without touching the real backend.
 */
async function runMockPipeline(generationId: string, opts: PipelineOpts) {
  const supabase = getSupabaseAdmin();
  const fakeRequestId = `mock_${crypto.randomUUID()}`;

  await supabase
    .from("generations")
    .update({ fal_request_id: fakeRequestId })
    .eq("id", generationId);

  await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 3000));

  const succeeded = Math.random() < 0.9;

  if (!succeeded) {
    await markFailed(generationId, opts);
    return;
  }

  const videoUrl = MOCK_VIDEO_URLS[Math.floor(Math.random() * MOCK_VIDEO_URLS.length)];
  await supabase
    .from("generation_videos")
    .update({ status: "completed", video_url: videoUrl })
    .eq("generation_id", generationId)
    .eq("script_index", 0);
  await supabase.from("generations").update({ status: "completed" }).eq("id", generationId);
}

