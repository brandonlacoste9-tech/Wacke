import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { streams } from "@wacke/db";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (status !== "live" && status !== "offline") {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Fetch Wacke user
    const { data: wackeUser } = await supabase.from("users").select("id").eq("supabase_id", user.id).single();
    
    if (wackeUser) {
      await db.update(streams)
        .set({ status })
        .where(eq(streams.userId, wackeUser.id));
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[STREAM_STATUS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
