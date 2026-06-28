import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId, toggleFollow, isFollowing, getFollowerCount } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/users/follow
 * Toggles a follow relationship between the authenticated viewer and a streamer.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAdmin();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const dbUser = await getUserBySupabaseId(authUser.id);

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const { streamerId } = body as { streamerId: string };

    if (!streamerId) {
      return NextResponse.json({ error: "ID du streamer manquant" }, { status: 400 });
    }

    if (dbUser.id === streamerId) {
      return NextResponse.json({ error: "Tu ne peux pas te suivre toi-même!" }, { status: 400 });
    }

    // Toggle follow status using our database abstraction
    const result = await toggleFollow({
      followerId: dbUser.id,
      followingId: streamerId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[FOLLOW_POST_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET /api/users/follow
 * Gets the follow status and total follower count for a streamer.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamerId = searchParams.get("streamerId");
    const followerId = searchParams.get("followerId");

    if (!streamerId) {
      return NextResponse.json({ error: "ID du streamer manquant" }, { status: 400 });
    }

    let isFollowingViewer = false;
    if (followerId) {
      isFollowingViewer = await isFollowing(followerId, streamerId);
    }

    // Get total follower count
    const followerCount = await getFollowerCount(streamerId);

    return NextResponse.json({
      isFollowing: isFollowingViewer,
      followerCount,
    });
  } catch (error) {
    console.error("[FOLLOW_GET_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
