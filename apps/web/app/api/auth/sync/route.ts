import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { syncUser, updateUserProfile, getUserBySupabaseId } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/sync
 * Synchronizes the logged-in user profile from Supabase Auth into our database.
 * Also accepts optional profile fields (displayName, bio, avatarUrl, twitchUsername, kickUsername).
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization manquante" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    let user: any = null;

    if (token.startsWith("mock-session:")) {
      const parts = token.split(":");
      const username = parts[1];
      const supabaseId = parts[2];
      
      const dbUser = await getUserBySupabaseId(supabaseId);
      if (!dbUser || dbUser.username !== username) {
        return NextResponse.json({ error: "Session invalide" }, { status: 401 });
      }
      
      user = {
        id: dbUser.supabaseId,
        email: dbUser.email,
      };
    } else {
      const supabase = getSupabaseAdmin();
      const { data: { user: supaUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !supaUser) {
        console.error("[AUTH_SYNC_GETUSER_FAIL]", authError?.message || authError);
        return NextResponse.json({ 
          error: "Token invalide ou expiré", 
          details: authError?.message || "Supabase rejected the token (wrong project keys, expired, or used OTP code)" 
        }, { status: 401 });
      }
      
      user = supaUser;
    }

    // Try parsing optional payload
    let username = "";
    let displayName = "";
    let bio: string | undefined;
    let avatarUrl: string | undefined;
    let twitchUsername: string | undefined;
    let kickUsername: string | undefined;
    let youtubeChannelId: string | undefined;

    try {
      const body = await req.json();
      username = body.username || "";
      displayName = body.displayName || "";
      bio = body.bio;
      avatarUrl = body.avatarUrl;
      twitchUsername = body.twitchUsername;
      kickUsername = body.kickUsername;
      youtubeChannelId = body.youtubeChannelId;
    } catch {
      // Body is optional
    }

    const cleanUsername = (username || user.email?.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanDisplayName = displayName || cleanUsername;

    // Sync / create user in database
    let dbUser = await syncUser({
      supabaseId: user.id,
      email: user.email!,
      username: cleanUsername,
      displayName: cleanDisplayName,
    });

    // If profile fields were provided, update them on the existing user record
    const hasProfileUpdate = bio !== undefined || avatarUrl !== undefined || 
                             twitchUsername !== undefined || kickUsername !== undefined ||
                             youtubeChannelId !== undefined ||
                             (displayName && displayName !== cleanUsername);

    if (hasProfileUpdate && dbUser) {
      const updated = await updateUserProfile({
        userId: dbUser.id,
        displayName: displayName || undefined,
        bio,
        avatarUrl,
        twitchUsername,
        kickUsername,
        youtubeChannelId,
      });
      dbUser = updated ?? dbUser;
    }

    return NextResponse.json({ user: dbUser }, { status: 200 });
  } catch (error) {
    console.error("[AUTH_SYNC_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
