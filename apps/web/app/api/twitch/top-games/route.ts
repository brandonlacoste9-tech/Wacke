import { NextRequest, NextResponse } from "next/server";
import { getTwitchTopGames } from "@/lib/twitch-api";

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = "force-dynamic";

/**
 * GET /api/twitch/top-games
 *
 * Query params:
 *   limit — number of games to fetch (default 6, max 12)
 *
 * Returns:
 *   { games: TwitchGame[] }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "6", 10), 12);

  try {
    const rawGames = await getTwitchTopGames(limit);

    // Resolve game cover dimensions (converting Twitch placeholders like {width}x{height} to standard sizing)
    const games = rawGames.map((g) => ({
      id: g.id,
      name: g.name,
      boxArtUrl: g.box_art_url
        ? g.box_art_url.replace("{width}", "180").replace("{height}", "240")
        : null,
    }));

    return NextResponse.json(
      { games },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[api/twitch/top-games] Error:", err);
    return NextResponse.json({ games: [] }, { status: 500 });
  }
}
