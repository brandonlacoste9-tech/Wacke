import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createMuxLiveStream, deleteMuxLiveStream } from "@/lib/mux";
import { db, users, streams } from "@wacke/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/mux/stream
 * Creates a new Mux Live Stream for the authenticated user.
 * Returns the RTMP stream key for OBS/streaming software.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });
    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, sacreModeEnabled = true } = body as {
      title: string;
      category: string;
      sacreModeEnabled?: boolean;
    };

    // Create Mux Live Stream
    const { liveStreamId, streamKey, playbackId } = await createMuxLiveStream();

    // Upsert stream record in DB
    const [stream] = await db
      .insert(streams)
      .values({
        userId: dbUser.id,
        title,
        category: category as any,
        status: "offline", // Status updates via Mux webhook
        muxPlaybackId: playbackId,
        muxAssetId: liveStreamId,
        sacreModeEnabled,
      })
      .onConflictDoUpdate({
        target: streams.userId,
        set: {
          title,
          category: category as any,
          muxPlaybackId: playbackId,
          muxAssetId: liveStreamId,
          sacreModeEnabled,
          status: "offline",
          updatedAt: new Date(),
        },
      })
      .returning();

    // Update user with Mux credentials
    await db
      .update(users)
      .set({
        muxStreamKey: streamKey,
        muxPlaybackId: playbackId,
        muxLiveStreamId: liveStreamId,
        isStreamer: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, dbUser.id));

    return NextResponse.json({
      streamId: stream.id,
      streamKey, // Only returned once — streamer must save this
      playbackId,
      rtmpUrl: "rtmps://global-live.mux.com:443/app",
    });
  } catch (error) {
    console.error("[MUX_STREAM_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/mux/stream
 * Ends the live stream and cleans up Mux resources.
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });
    if (!dbUser?.muxLiveStreamId) {
      return NextResponse.json({ error: "Aucun stream actif" }, { status: 404 });
    }

    await deleteMuxLiveStream(dbUser.muxLiveStreamId);

    // Update stream status to ended
    await db
      .update(streams)
      .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(streams.userId, dbUser.id));

    // Clear Mux credentials from user
    await db
      .update(users)
      .set({
        muxStreamKey: null,
        muxLiveStreamId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, dbUser.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUX_STREAM_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
