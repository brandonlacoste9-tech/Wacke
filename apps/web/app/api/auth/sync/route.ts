import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { syncUser } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/sync
 * Synchronizes the logged-in user profile from Supabase Auth into our database.
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

    // Try parsing optional payload
    let username = "";
    let displayName = "";
    try {
      const body = await req.json();
      username = body.username || "";
      displayName = body.displayName || "";
    } catch {
      // Body is optional
    }

    const cleanUsername = (username || user.email?.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanDisplayName = displayName || cleanUsername;

    // Use our database query sync helper
    const dbUser = await syncUser({
      supabaseId: user.id,
      email: user.email!,
      username: cleanUsername,
      displayName: cleanDisplayName,
    });

    return NextResponse.json({ user: dbUser }, { status: 200 });
  } catch (error) {
    console.error("[AUTH_SYNC_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
