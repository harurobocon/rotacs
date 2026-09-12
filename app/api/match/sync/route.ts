import { NextResponse } from "next/server";
import { syncMatchesFromHomepage } from "@/lib/server/matchSync";

export async function POST(request: Request) {
  let apiUrl: string | undefined = undefined;
  try {
    const body = await request.json();
    if (body && typeof body.apiUrl === "string") {
      apiUrl = body.apiUrl;
    }
  } catch {
    // Ignore if body is empty or non-JSON
  }

  const result = await syncMatchesFromHomepage(apiUrl);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Synced ${result.syncedCount} matches from homepage`,
    syncedCount: result.syncedCount,
  });
}

export async function GET() {
  const result = await syncMatchesFromHomepage();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Synced ${result.syncedCount} matches from homepage`,
    syncedCount: result.syncedCount,
  });
}
