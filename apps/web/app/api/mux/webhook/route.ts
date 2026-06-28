import { NextRequest, NextResponse } from "next/server";
import { updateStreamStatusByMuxId } from "@wacke/db";
import crypto from "crypto";

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
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET!;
    const [, sigHash] = signature.split(",").map((s) => s.split("=")[1]);
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (sigHash !== expectedSig) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const event = JSON.parse(body);
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
