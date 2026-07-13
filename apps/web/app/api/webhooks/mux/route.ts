import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, streams } from "@wacke/db";
import { verifyMuxWebhook } from "@/lib/mux";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/mux
 * Configure in Mux Dashboard → Webhooks → https://wacke.live/api/webhooks/mux
 * Events: video.live_stream.active, video.live_stream.idle, video.live_stream.disconnected
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig =
    req.headers.get("mux-signature") ||
    req.headers.get("Mux-Signature");

  if (!verifyMuxWebhook(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(raw) as {
      type: string;
      data: { id?: string; live_stream_id?: string };
    };

    const liveId = event.data?.id || event.data?.live_stream_id;
    if (!liveId) {
      return NextResponse.json({ received: true });
    }

    if (
      event.type === "video.live_stream.active" ||
      event.type === "video.live_stream.connected"
    ) {
      await db
        .update(streams)
        .set({
          status: "live",
          startedAt: new Date(),
          endedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(streams.muxLiveStreamId, liveId));
    }

    if (
      event.type === "video.live_stream.idle" ||
      event.type === "video.live_stream.disconnected" ||
      event.type === "video.live_stream.disabled"
    ) {
      await db
        .update(streams)
        .set({
          status: "offline",
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(streams.muxLiveStreamId, liveId));
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[mux webhook]", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
