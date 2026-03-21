import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db, messages, streams, users } from "@wacke/db";
import { moderateMessage } from "@/lib/moderation";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // ─── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    // ─── Parse Body ──────────────────────────────────────────────────────────
    const body = await req.json();
    const { streamId, content } = body as {
      streamId: string;
      content: string;
    };

    if (!streamId || !content) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // ─── Fetch Stream & Validate ─────────────────────────────────────────────
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, streamId),
    });

    if (!stream || stream.status !== "live") {
      return NextResponse.json({ error: "Stream non trouvé ou hors ligne" }, { status: 404 });
    }

    // ─── Fetch DB User ────────────────────────────────────────────────────────
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser || dbUser.isBanned) {
      return NextResponse.json({ error: "Compte non autorisé" }, { status: 403 });
    }

    // ─── Server-Side Moderation ───────────────────────────────────────────────
    const modResult = moderateMessage(content, stream.sacreModeEnabled);
    if (!modResult.allowed) {
      return NextResponse.json({ error: modResult.reason }, { status: 422 });
    }

    // ─── Persist Message ──────────────────────────────────────────────────────
    const [newMessage] = await db
      .insert(messages)
      .values({
        streamId,
        userId: dbUser.id,
        content: modResult.sanitized,
        isSacre: modResult.isSacre,
      })
      .returning();

    // ─── Broadcast via Supabase Realtime ──────────────────────────────────────
    // Broadcast the full hydrated message object so subscribers don't need
    // to make a separate DB call to get user data.
    const hydratedMessage = {
      ...newMessage,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl,
      },
    };

    await supabase.channel(`graffiti-chat:${streamId}`).send({
      type: "broadcast",
      event: "chat_message",
      payload: hydratedMessage,
    });

    return NextResponse.json({ message: hydratedMessage }, { status: 201 });
  } catch (error) {
    console.error("[CHAT_API_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
