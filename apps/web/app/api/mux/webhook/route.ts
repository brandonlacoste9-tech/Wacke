import { NextRequest, NextResponse } from "next/server";
import { db, streams, users } from "@wacke/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const runtime = "nodejs"; // Needs crypto for webhook signature verification
export const dynamic = 'force-dynamic';

/**
 * POST /api/mux/webhook
 * Handles Mux webhook events for stream lifecycle management.
 *
 * Configure in Mux Dashboard:
 *   URL: https://your-domain.com/api/mux/webhook
 *   Events: video.live_stream.active, video.live_stream.idle, video.live_stream.disconnected
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
        const dbUser = await db.query.users.findFirst({
          where: eq(users.muxLiveStreamId, liveStreamId),
        });
        if (dbUser) {
          await db
            .update(streams)
            .set({ status: "live", startedAt: new Date(), updatedAt: new Date() })
            .where(eq(streams.userId, dbUser.id));
        }
        break;
      }

      case "video.live_stream.idle":
      case "video.live_stream.disconnected": {
        // Streamer has disconnected or stream has gone idle
        const dbUser = await db.query.users.findFirst({
          where: eq(users.muxLiveStreamId, liveStreamId),
        });
        if (dbUser) {
          await db
            .update(streams)
            .set({ status: "offline", updatedAt: new Date() })
            .where(eq(streams.userId, dbUser.id));
        }
        break;
      }

      default:
        // Unhandled event type — log and acknowledge
        console.log(`[MUX_WEBHOOK] Unhandled event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[MUX_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
