import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: video, error: fetchError } = await supabase
    .from("generation_videos")
    .select("id, generations!inner(clerk_user_id)")
    .eq("id", videoId)
    .single();

  const owner = (video as unknown as { generations: { clerk_user_id: string } } | null)
    ?.generations?.clerk_user_id;

  if (fetchError || !video || owner !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("generation_videos")
    .delete()
    .eq("id", videoId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
