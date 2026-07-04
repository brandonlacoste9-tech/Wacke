import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kick/channel-info?slug={username}
 * 
 * Fetches the Kick channel's chatroom_id needed for Pusher WebSocket subscription.
 * Uses Kick's public v2 web API (no auth required for public channels).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug")?.toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
  }

  // Handle mock slugs — return a fake chatroom_id
  if (slug.startsWith("kick-mock-streamer-")) {
    const channel = slug.replace("kick-mock-streamer-", "");
    return NextResponse.json({
      slug: channel,
      chatroomId: null,
      isMock: true,
    });
  }

  try {
    // Use Kick's public channel API to get chatroom info
    const res = await fetch(`https://kick.com/api/v2/channels/${slug}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[kick/channel-info] Failed for ${slug}: ${res.status} ${res.statusText}`);
      return NextResponse.json({ error: `Kick API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const chatroomId = data?.chatroom?.id ?? null;

    return NextResponse.json(
      { slug, chatroomId, isMock: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[kick/channel-info] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
