import { NextResponse } from "next/server";
import { processRoLIMOAStatusUpdate } from "@/lib/server/match";
import { RoLIMOAStatusPayload } from "@/types/match";

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.ROLIMOA_API_SECRET?.trim();
    if (expectedSecret) {
      const authHeader = request.headers.get("X-RoLIMOA-Secret");
      if (authHeader !== expectedSecret) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }

    const payload: RoLIMOAStatusPayload = await request.json();
    const result = await processRoLIMOAStatusUpdate(payload);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (err: any) {
    console.error("API /api/match/status error:", err);
    return NextResponse.json(
      { ok: false, error: err.toString() },
      { status: 500 },
    );
  }
}
