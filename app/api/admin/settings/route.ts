import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import {
  getAppSettings,
  setAppMode,
  setGenerationEnabled,
  testModeAllowed,
  type AppMode,
} from "@/lib/app-settings-server";

export async function GET() {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getAppSettings();
  return NextResponse.json({ settings, testModeAllowed: testModeAllowed() });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (typeof body?.generationEnabled === "boolean") {
    await setGenerationEnabled(body.generationEnabled);
  }

  if (body?.mode === "live" || body?.mode === "test") {
    if (body.mode === "test" && !testModeAllowed()) {
      return NextResponse.json(
        { error: "Test mode is disabled in production" },
        { status: 403 }
      );
    }
    await setAppMode(body.mode as AppMode);
  }

  const settings = await getAppSettings();
  return NextResponse.json({ settings, testModeAllowed: testModeAllowed() });
}
