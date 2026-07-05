import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TWITCH_MESSAGE_ID = "twitch-eventsub-message-id";
const TWITCH_MESSAGE_TIMESTAMP = "twitch-eventsub-message-timestamp";
const TWITCH_MESSAGE_SIGNATURE = "twitch-eventsub-message-signature";
const MESSAGE_TYPE = "twitch-eventsub-message-type";

const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification";
const MESSAGE_TYPE_NOTIFICATION = "notification";
const MESSAGE_TYPE_REVOCATION = "revocation";

/**
 * Verify Twitch EventSub signature.
 * @see https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#verifying-the-event-message
 */
function verifyTwitchSignature(
  secret: string,
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const hmacMessage = messageId + timestamp + body;
  const hmac =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(hmacMessage).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

/**
 * POST /api/webhooks/twitch
 *
 * Handles Twitch EventSub webhook notifications:
 * - Responds to subscription challenge (verification)
 * - Handles stream.online → update DB to live
 * - Handles stream.offline → update DB to offline
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[twitch/webhook] TWITCH_WEBHOOK_SECRET not set");
    return new NextResponse("Server config error", { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();

  const messageId = req.headers.get(TWITCH_MESSAGE_ID) ?? "";
  const timestamp = req.headers.get(TWITCH_MESSAGE_TIMESTAMP) ?? "";
  const signature = req.headers.get(TWITCH_MESSAGE_SIGNATURE) ?? "";
  const messageType = req.headers.get(MESSAGE_TYPE) ?? "";

  // Verify signature
  let isValid = false;
  try {
    isValid = verifyTwitchSignature(secret, messageId, timestamp, rawBody, signature);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    console.warn("[twitch/webhook] Invalid signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Reject stale messages (older than 10 minutes)
  const msgAge = Date.now() - new Date(timestamp).getTime();
  if (msgAge > 10 * 60 * 1000) {
    return new NextResponse("Message too old", { status: 409 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // ── Challenge (subscription verification) ────────────────────────────────
  if (messageType === MESSAGE_TYPE_VERIFICATION) {
    console.log("[twitch/webhook] Challenge received, responding...");
    return new NextResponse(payload.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ── Revocation ────────────────────────────────────────────────────────────
  if (messageType === MESSAGE_TYPE_REVOCATION) {
    console.warn(
      `[twitch/webhook] Subscription revoked: ${payload.subscription?.type} — reason: ${payload.subscription?.status}`
    );
    return new NextResponse(null, { status: 204 });
  }

  // ── Notification ──────────────────────────────────────────────────────────
  if (messageType === MESSAGE_TYPE_NOTIFICATION) {
    const eventType = payload.subscription?.type as string;
    const event = payload.event;

    console.log(`[twitch/webhook] Event received: ${eventType}`, event);

    try {
      if (eventType === "stream.online") {
        // streamer went live — update the Wacké DB
        await handleStreamOnline(event);
      } else if (eventType === "stream.offline") {
        // streamer went offline — update the Wacké DB
        await handleStreamOffline(event);
      }
    } catch (err) {
      console.error(`[twitch/webhook] Handler error for ${eventType}:`, err);
      // Still return 200 so Twitch doesn't retry
    }

    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}

// ── Event Handlers ────────────────────────────────────────────────────────────

/**
 * Handle stream.online: mark streamer live in our DB.
 */
async function handleStreamOnline(event: {
  broadcaster_user_login: string;
  broadcaster_user_id: string;
  type: string;
  started_at: string;
}) {
  const { db, users, streams } = await import("@wacke/db");
  const { eq, and } = await import("drizzle-orm");

  const twitchLogin = event.broadcaster_user_login.toLowerCase();

  // Find the Wacké user with this twitch username
  const [wackeUser] = await db
    .select()
    .from(users)
    .where(eq(users.twitchUsername, twitchLogin))
    .limit(1);

  if (!wackeUser) {
    console.log(`[twitch/webhook] No Wacké user found for twitch login: ${twitchLogin}`);
    return;
  }

  // Find or update their live stream
  const [existingStream] = await db
    .select()
    .from(streams)
    .where(and(eq(streams.userId, wackeUser.id), eq(streams.status, "offline")))
    .limit(1);

  if (existingStream) {
    await db
      .update(streams)
      .set({
        status: "live",
        startedAt: new Date(event.started_at),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, existingStream.id));
    console.log(`[twitch/webhook] ✅ Marked stream live for ${twitchLogin}`);
  } else {
    console.log(`[twitch/webhook] No offline stream to update for ${twitchLogin}`);
  }
}

/**
 * Handle stream.offline: mark streamer offline in our DB.
 */
async function handleStreamOffline(event: {
  broadcaster_user_login: string;
  broadcaster_user_id: string;
}) {
  const { db, users, streams } = await import("@wacke/db");
  const { eq, and } = await import("drizzle-orm");

  const twitchLogin = event.broadcaster_user_login.toLowerCase();

  const [wackeUser] = await db
    .select()
    .from(users)
    .where(eq(users.twitchUsername, twitchLogin))
    .limit(1);

  if (!wackeUser) {
    console.log(`[twitch/webhook] No Wacké user found for twitch login: ${twitchLogin}`);
    return;
  }

  await db
    .update(streams)
    .set({
      status: "offline",
      endedAt: new Date(),
      viewerCount: 0,
      updatedAt: new Date(),
    })
    .where(and(eq(streams.userId, wackeUser.id), eq(streams.status, "live")));

  console.log(`[twitch/webhook] ✅ Marked stream offline for ${twitchLogin}`);
}
