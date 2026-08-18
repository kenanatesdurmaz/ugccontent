import { getSupabaseAdmin } from "@/lib/supabase";

export type AppMode = "live" | "test";

export type AppSettings = {
  generationEnabled: boolean;
  mode: AppMode;
};

const SETTINGS_ID = "global";

/**
 * Production must never silently end up in test mode — even an admin
 * can't switch it on unless this is explicitly set, since test mode skips
 * real fal.ai calls (and would make "video generation" a no-op for real
 * users if left on by mistake).
 */
export function testModeAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return (process.env.ALLOW_TEST_MODE_IN_PRODUCTION ?? "").trim().toLowerCase() === "true";
}

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  return {
    generationEnabled: data?.generation_enabled ?? true,
    mode: (data?.mode as AppMode) ?? "live",
  };
}

export async function setGenerationEnabled(enabled: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: SETTINGS_ID, generation_enabled: enabled, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function setAppMode(mode: AppMode) {
  if (mode === "test" && !testModeAllowed()) {
    throw new Error("Test mode is not allowed in production");
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: SETTINGS_ID, mode, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
