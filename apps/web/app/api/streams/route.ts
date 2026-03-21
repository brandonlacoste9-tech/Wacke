import { NextRequest, NextResponse } from "next/server";
import { getLiveStreams } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/streams
 * Returns all currently live streams, ordered by viewer count.
 * Used by the homepage and browse page for the stream grid.
 *
 * Query params:
 *   - limit: number (default: 20, max: 100)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    const liveStreams = await getLiveStreams(limit);

    return NextResponse.json(
      { streams: liveStreams },
      {
        headers: {
          // Cache for 10 seconds — balances freshness with DB load
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[STREAMS_GET_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
