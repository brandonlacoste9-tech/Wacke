import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/twitch/eventsub/subscribe
 *
 * Admin-protected endpoint to register EventSub subscriptions for a Twitch user.
 * Subscribes to both `stream.online` and `stream.offline` events.
 *
 * Body: { "login": "twitchUsername" }
 * Header: Authorization: Bearer <TWITCH_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  // Simple admin auth check using the webhook secret as a bearer token
  const authHeader = req.headers.get("Authorization") ?? "";
  const adminSecret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const webhookSecret = adminSecret;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json({ error: "Server config incomplete" }, { status: 500 });
  }

  let login: string;
  try {
    const body = await req.json();
    login = body.login?.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!login) {
    return NextResponse.json({ error: "Missing `login` in body" }, { status: 400 });
  }

  // 1. Get App Access Token (client credentials)
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[eventsub/subscribe] Token fetch failed:", err);
    return NextResponse.json({ error: "Failed to get Twitch app token" }, { status: 502 });
  }

  const { access_token } = await tokenRes.json();

  // 2. Resolve Twitch user ID from login name
  const userRes = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": clientId,
      },
    }
  );

  if (!userRes.ok) {
    return NextResponse.json({ error: "Failed to resolve Twitch user" }, { status: 502 });
  }

  const userData = await userRes.json();
  const twitchUser = userData.data?.[0];

  if (!twitchUser) {
    return NextResponse.json({ error: `Twitch user "${login}" not found` }, { status: 404 });
  }

  const broadcasterId = twitchUser.id;
  const callbackUrl = `${appUrl}/api/webhooks/twitch`;

  // 3. Subscribe to stream.online and stream.offline
  const subscriptionTypes = ["stream.online", "stream.offline"];
  const results: Record<string, any> = {};

  for (const type of subscriptionTypes) {
    const subRes = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": clientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        version: "1",
        condition: { broadcaster_user_id: broadcasterId },
        transport: {
          method: "webhook",
          callback: callbackUrl,
          secret: webhookSecret,
        },
      }),
    });

    const subData = await subRes.json();
    results[type] = subRes.ok
      ? { success: true, id: subData.data?.[0]?.id, status: subData.data?.[0]?.status }
      : { success: false, error: subData };
  }

  return NextResponse.json({
    login,
    broadcasterId,
    callbackUrl,
    subscriptions: results,
  });
}

/**
 * GET /api/twitch/eventsub/subscribe
 * Lists all active EventSub subscriptions for this app.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const adminSecret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server config incomplete" }, { status: 500 });
  }

  // Get app access token
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  const { access_token } = await tokenRes.json();

  const listRes = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Client-Id": clientId,
    },
  });

  const data = await listRes.json();
  return NextResponse.json(data);
}
