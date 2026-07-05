import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { streams } from "@wacke/db";
import { eq } from "drizzle-orm";
import { db } from "@wacke/db";

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

    // Call Cloudflare API to create a live input
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json({ error: "Configuration Cloudflare manquante" }, { status: 500 });
    }

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: { name: `Stream for ${user.id}` },
          recording: { mode: "automatic" }
        })
      }
    );

    if (!cfResponse.ok) {
      const err = await cfResponse.text();
      console.error("[CF_STREAM_ERROR]", err);
      return NextResponse.json({ error: "Erreur Cloudflare" }, { status: 500 });
    }

    const cfData = await cfResponse.json();
    const liveInput = cfData.result;

    const whipUrl = liveInput.webRTC.url;
    const playbackId = liveInput.uid;

    // We don't save it to the DB just yet; the client will start broadcasting first
    // and then call another endpoint to update their status, or we can save it now.
    
    // Save to database
    // Note: We need the Wacke user ID. We have the Supabase ID.
    // Fetch Wacke user
    const { data: wackeUser } = await supabase.from("users").select("id").eq("supabase_id", user.id).single();
    if (wackeUser) {
      // Find stream
      await db.update(streams)
        .set({
          cloudflareStreamId: liveInput.uid,
          cloudflarePlaybackId: liveInput.uid,
          status: "offline", // Will be marked live when they actually connect
        })
        .where(eq(streams.userId, wackeUser.id));
    }

    return NextResponse.json({
      success: true,
      whipUrl,
      playbackId,
    });
  } catch (error) {
    console.error("[STREAM_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
