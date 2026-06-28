import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db, users } from "@wacke/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/sync
 * Synchronizes the logged-in user profile from Supabase Auth into our Postgres database.
 * If user does not exist in the users table, it inserts a new record.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization manquante" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    // Try parsing optional payload (for profile registration details)
    let username = "";
    let displayName = "";
    try {
      const body = await req.json();
      username = body.username || "";
      displayName = body.displayName || "";
    } catch {
      // Body is optional
    }

    // Check if user exists by Supabase ID
    let dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      // Build unique fallback username
      let finalUsername = (
        username ||
        user.email?.split("@")[0] ||
        "wackeur_" + Math.random().toString(36).substring(5)
      )
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      // Ensure username fits length constraints
      if (finalUsername.length > 32) {
        finalUsername = finalUsername.substring(0, 32);
      }

      // Check username collision
      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, finalUsername),
      });

      if (existingUsername) {
        finalUsername = (finalUsername.substring(0, 24) + "_" + Math.random().toString(36).substring(5)).substring(0, 32);
      }

      const finalDisplayName = displayName || finalUsername;

      const [newUser] = await db
        .insert(users)
        .values({
          supabaseId: user.id,
          email: user.email!,
          username: finalUsername,
          displayName: finalDisplayName,
          tokenBalance: 500, // Welcome gift!
        })
        .returning();
      
      dbUser = newUser;
    }

    return NextResponse.json({ user: dbUser }, { status: 200 });
  } catch (error) {
    console.error("[AUTH_SYNC_ERROR]", error);
    return NextResponse.json({ error: "Erreur lors de la synchronisation de l'utilisateur" }, { status: 500 });
  }
}
