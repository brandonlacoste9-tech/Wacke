import { NextRequest, NextResponse } from "next/server";
import { getTwitchLivestreams, getTwitchUsers, resolveTwitchThumbnail } from "@/lib/twitch-api";

export const revalidate = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/twitch/livestreams
 *
 * Query params:
 *   limit    — number of streams (default 20, max 50)
 *   game_id  — Twitch game ID filter (optional)
 *
 * Returns streams enriched with profile images from the /users endpoint.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const gameId = searchParams.get("game_id") ?? undefined;

  try {
    const streams = await getTwitchLivestreams(limit, gameId);

    if (streams.length === 0) {
      return NextResponse.json({ streams: [], source: "twitch" });
    }

    // Enrich with profile images in a single batch call
    const logins = streams.map((s) => s.user_login);
    const users  = await getTwitchUsers(logins);
    const userMap = Object.fromEntries(users.map((u) => [u.login, u]));

    const enriched = streams.map((s) => ({
      ...s,
      thumbnail_url: resolveTwitchThumbnail(s.thumbnail_url, 640, 360),
      profile_image_url: userMap[s.user_login]?.profile_image_url ?? null,
    }));

    return NextResponse.json(
      { streams: enriched, source: "twitch" as const },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[api/twitch/livestreams] Error:", err);
    return NextResponse.json({ streams: [], source: "error" as const }, { status: 500 });
  }
}
