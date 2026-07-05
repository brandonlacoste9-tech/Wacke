import { NextRequest, NextResponse } from "next/server";
import { getTwitchStreamByLogin, getTwitchChannelInfo } from "@/lib/twitch-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/twitch/channel-info?login=<username>
 *
 * Returns enriched channel info for a Twitch streamer:
 * live status, viewer count, game, title, thumbnail, follower count.
 */
export async function GET(req: NextRequest) {
  const login = req.nextUrl.searchParams.get("login");

  if (!login) {
    return NextResponse.json({ error: "Missing `login` query param" }, { status: 400 });
  }

  try {
    const [stream, channel] = await Promise.all([
      getTwitchStreamByLogin(login),
      getTwitchChannelInfo(login),
    ]);

    const isLive = !!stream && stream.type === "live";

    return NextResponse.json(
      {
        login,
        isLive,
        stream: stream ?? null,
        channel: channel ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[api/twitch/channel-info] Error:", err);
    return NextResponse.json({ error: "Failed to fetch channel info" }, { status: 500 });
  }
}
