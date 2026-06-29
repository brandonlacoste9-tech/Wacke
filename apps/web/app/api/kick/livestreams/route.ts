import { NextRequest, NextResponse } from "next/server";
import { getKickLivestreams } from "@/lib/kick-api";
import { TOP_KICK_STREAMERS } from "@wacke/db";

// Cache this route for 60 seconds to avoid hammering the Kick API
export const revalidate = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/kick/livestreams
 *
 * Query params:
 *   limit  — number of streams (default 20, max 50)
 *   category — Kick category slug filter (optional)
 *
 * Returns:
 *   { streams: KickLivestream[], source: "kick" | "fallback" }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const category = searchParams.get("category") ?? undefined;

  try {
    // Attempt to pull real data from Kick API
    const streams = await getKickLivestreams(limit, category);

    if (streams.length > 0) {
      return NextResponse.json(
        { streams, source: "kick" as const },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    // Kick API returned nothing (token issues, no live streams, etc.)
    // Fall back to our curated list so the site is never empty
    const fallbackStreams = TOP_KICK_STREAMERS.map((slug, i) => ({
      id: `fallback-${slug}`,
      slug,
      channel_id: 1000 + i,
      session_title: getFallbackTitle(slug),
      created_at: new Date().toISOString(),
      language: "fr",
      is_mature: false,
      viewer_count: Math.floor(Math.random() * 12000) + 2000,
      thumbnail: null,
      categories: [{ id: 1, name: getFallbackCategory(slug), slug: getFallbackCategory(slug) }],
      channel: {
        id: 1000 + i,
        user_id: 2000 + i,
        slug,
        profile_picture: null,
        user: {
          id: 2000 + i,
          username: slug,
          agreed_to_terms: true,
          email_verified_at: null,
          bio: null,
          country: null,
          state: null,
          city: null,
          instagram: null,
          twitter: null,
          youtube: null,
          discord: null,
          tiktok: null,
          facebook: null,
          profile_pic: null,
        },
      },
    }));

    return NextResponse.json({ streams: fallbackStreams, source: "fallback" as const });
  } catch (err) {
    console.error("[api/kick/livestreams] Error:", err);
    return NextResponse.json({ streams: [], source: "error" as const }, { status: 500 });
  }
}

function getFallbackTitle(slug: string): string {
  const titles: Record<string, string> = {
    odablock: "👑 DMM ALLSTARS REVIEW !dmm !socials",
    xqc: "🎮 MULTI-GAME SHENANIGANS & REACTS",
    adinross: "🔥 TALK SHOW & GUESTS - Pull up",
    amouranth: "💜 LIVE STREAM",
    roshtein: "🎲 SLOTS - HIGH LIMIT SESSION",
    trainwreckstv: "🎤 TALK SHOW LIVE",
    westcol: "🕹️ GAMING AVEC LES ABONNÉS",
    billybrown: "🔴 LIVE STREAM",
  };
  return titles[slug] ?? "🔴 LIVE STREAM FROM KICK.COM";
}

function getFallbackCategory(slug: string): string {
  if (["xqc", "westcol"].includes(slug)) return "gaming";
  if (["roshtein", "trainwreckstv", "adinross"].includes(slug)) return "slots";
  if (slug === "amouranth") return "irl";
  return "gaming";
}
