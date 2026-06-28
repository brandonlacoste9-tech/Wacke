import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db, follows, users } from "@wacke/db";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/users/follow
 * Toggles a follow relationship between the authenticated viewer and a streamer.
 * If already following, it deletes the follow record. Otherwise, it inserts one.
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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, authUser.id),
    });

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

    // Check if follow already exists
    const existingFollow = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, dbUser.id),
        eq(follows.followingId, streamerId)
      ),
    });

    if (existingFollow) {
      // Unfollow
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, dbUser.id),
            eq(follows.followingId, streamerId)
          )
        );
      
      return NextResponse.json({ following: false, message: "Désabonné avec succès 💔" });
    } else {
      // Follow
      await db
        .insert(follows)
        .values({
          followerId: dbUser.id,
          followingId: streamerId,
        });

      return NextResponse.json({ following: true, message: "Abonné avec succès 💜" });
    }
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
      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, streamerId)
        ),
      });
      isFollowingViewer = !!existingFollow;
    }

    // Get total count
    const followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, streamerId));

    return NextResponse.json({
      isFollowing: isFollowingViewer,
      followerCount: followers.length,
    });
  } catch (error) {
    console.error("[FOLLOW_GET_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
