import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, streams, users, getUserBySupabaseId } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";
import {
  createMuxLiveStream,
  isMuxConfigured,
  enableMuxLiveStream,
} from "@/lib/mux";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/mux
 * Create or return Mux live stream credentials for the authenticated streamer (OBS RTMP).
 */
export async function POST(req: NextRequest) {
  try {
    if (!isMuxConfigured()) {
      return NextResponse.json(
        {
          error: "Mux non configuré",
          hint: "Set MUX_TOKEN_ID and MUX_TOKEN_SECRET on the host",
        },
        { status: 503 }
      );
    }

    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "Live Wacké";

    const dbUser = await getUserBySupabaseId(authUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Reuse existing Mux live input if present
    if (dbUser.muxLiveStreamId && dbUser.muxPlaybackId && dbUser.muxStreamKey) {
      await enableMuxLiveStream(dbUser.muxLiveStreamId).catch(() => {});

      // Ensure a streams row exists / is updated
      const existing = await db.query.streams.findFirst({
        where: eq(streams.userId, dbUser.id),
        orderBy: [desc(streams.createdAt)],
      });

      if (existing) {
        await db
          .update(streams)
          .set({
            title,
            muxLiveStreamId: dbUser.muxLiveStreamId,
            muxPlaybackId: dbUser.muxPlaybackId,
            muxStreamKey: dbUser.muxStreamKey,
            thumbnailUrl: `https://image.mux.com/${dbUser.muxPlaybackId}/thumbnail.jpg`,
            updatedAt: new Date(),
          })
          .where(eq(streams.id, existing.id));
      } else {
        await db.insert(streams).values({
          userId: dbUser.id,
          title,
          status: "offline",
          muxLiveStreamId: dbUser.muxLiveStreamId,
          muxPlaybackId: dbUser.muxPlaybackId,
          muxStreamKey: dbUser.muxStreamKey,
          thumbnailUrl: `https://image.mux.com/${dbUser.muxPlaybackId}/thumbnail.jpg`,
        });
      }

      return NextResponse.json({
        success: true,
        reused: true,
        liveStreamId: dbUser.muxLiveStreamId,
        playbackId: dbUser.muxPlaybackId,
        streamKey: dbUser.muxStreamKey,
        rtmpUrl: "rtmp://global-live.mux.com:5222/app",
        rtmpsUrl: "rtmps://global-live.mux.com:443/app",
        hlsUrl: `https://stream.mux.com/${dbUser.muxPlaybackId}.m3u8`,
      });
    }

    const live = await createMuxLiveStream(`wacke:${dbUser.username}`);

    await db
      .update(users)
      .set({
        muxLiveStreamId: live.id,
        muxPlaybackId: live.playbackId,
        muxStreamKey: live.streamKey,
        isStreamer: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, dbUser.id));

    await db.insert(streams).values({
      userId: dbUser.id,
      title,
      status: "offline",
      muxLiveStreamId: live.id,
      muxPlaybackId: live.playbackId,
      muxStreamKey: live.streamKey,
      thumbnailUrl: `https://image.mux.com/${live.playbackId}/thumbnail.jpg`,
    });

    return NextResponse.json({
      success: true,
      reused: false,
      liveStreamId: live.id,
      playbackId: live.playbackId,
      streamKey: live.streamKey,
      rtmpUrl: live.rtmpUrl,
      rtmpsUrl: live.rtmpsUrl,
      hlsUrl: `https://stream.mux.com/${live.playbackId}.m3u8`,
    });
  } catch (error) {
    console.error("[MUX_STREAM_CREATE]", error);
    return NextResponse.json(
      {
        error: "Erreur Mux",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}

/** GET — current Mux credentials for logged-in streamer */
export async function GET(req: NextRequest) {
  const authUserId = await resolveAuthUserId(
    req.headers.get("Authorization")
  );
  if (!authUserId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dbUser = await getUserBySupabaseId(authUserId);
  if (!dbUser?.muxPlaybackId) {
    return NextResponse.json({ configured: false, muxReady: isMuxConfigured() });
  }

  return NextResponse.json({
    configured: true,
    muxReady: isMuxConfigured(),
    playbackId: dbUser.muxPlaybackId,
    liveStreamId: dbUser.muxLiveStreamId,
    streamKey: dbUser.muxStreamKey,
    rtmpUrl: "rtmp://global-live.mux.com:5222/app",
    rtmpsUrl: "rtmps://global-live.mux.com:443/app",
    hlsUrl: `https://stream.mux.com/${dbUser.muxPlaybackId}.m3u8`,
  });
}
