import { NextRequest, NextResponse } from "next/server";
import { updateStreamStatusByMuxId } from "@wacke/db";
import Mux from "@mux/mux-node";
import { isMuxMocked } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/mux/webhook
 * Handles Mux webhook events for stream lifecycle management.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("mux-signature") ?? "";

    // ─── Signature Verification ───────────────────────────────────────────
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET || "";
    
    let event;
    try {
      if (isMuxMocked() || !webhookSecret) {
        // Bypass in mock or if no secret configured
        event = JSON.parse(body);
      } else {
        const mux = new Mux();
        event = mux.webhooks.unwrap(body, req.headers, webhookSecret);
      }
    } catch (err) {
      console.error("[MUX_WEBHOOK_VERIFY_ERROR]", err);
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
    const { type, data } = event;
    const liveStreamId = data?.id as string;

    switch (type) {
      case "video.live_stream.active": {
        // Streamer has connected and is broadcasting
        await updateStreamStatusByMuxId(liveStreamId, "live");
        break;
      }

      case "video.live_stream.idle":
      case "video.live_stream.disconnected": {
        // Streamer has disconnected
        await updateStreamStatusByMuxId(liveStreamId, "offline");
        break;
      }

      default:
        console.log(`[MUX_WEBHOOK] Unhandled event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[MUX_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
