import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createMuxLiveStream, deleteMuxLiveStream } from "@/lib/mux";
import { getUserBySupabaseId, upsertStream, updateUserMuxCredentials, endStream } from "@wacke/db";

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

    const dbUser = await getUserBySupabaseId(user.id);
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

    // Upsert stream record in DB using our package helper
    const stream = await upsertStream({
      userId: dbUser.id,
      title,
      category,
      sacreModeEnabled,
      muxPlaybackId: playbackId || null,
      muxAssetId: liveStreamId || null,
    });

    // Update user with Mux credentials using our package helper
    await updateUserMuxCredentials({
      userId: dbUser.id,
      muxStreamKey: streamKey || null,
      muxPlaybackId: playbackId || null,
      muxLiveStreamId: liveStreamId || null,
    });

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

    const dbUser = await getUserBySupabaseId(user.id);
    if (!dbUser?.muxLiveStreamId) {
      return NextResponse.json({ error: "Aucun stream actif" }, { status: 404 });
    }

    // Call Mux to delete the stream resources
    await deleteMuxLiveStream(dbUser.muxLiveStreamId);

    // End stream (set status to ended, clear credentials in users table)
    await endStream(dbUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUX_STREAM_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
