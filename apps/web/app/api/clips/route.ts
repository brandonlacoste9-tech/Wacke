import { NextRequest, NextResponse } from "next/server";
import { createResonanceEvent } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/clips
 * Log an overload clip share event (analytics / Roi du Chaos later).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamId, streamerName, caption, kind } = body as {
      streamId?: string;
      streamerName?: string;
      caption?: string | null;
      kind?: string;
    };

    if (!streamId) {
      return NextResponse.json({ error: "streamId required" }, { status: 400 });
    }

    // Reuse resonance_events as lightweight analytics bus
    await createResonanceEvent({
      slug: streamId,
      kind: `clip_${kind || "overload"}`.slice(0, 32),
      intensity: 0,
    });

    console.log(
      `[CLIP] stream=${streamId} streamer=${streamerName || "?"} kind=${kind || "overload"} caption=${(caption || "").slice(0, 80)}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CLIPS_POST_ERROR]", error);
    // Non-fatal for client — still return 200-ish soft success so UX continues
    return NextResponse.json({ success: false, error: "log failed" }, { status: 200 });
  }
}
