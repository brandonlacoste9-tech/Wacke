import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, streams, getUserBySupabaseId } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/mux/status
 * Body: { status: "live" | "offline", title?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const status = body.status === "live" ? "live" : "offline";
    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, 120) : undefined;

    const dbUser = await getUserBySupabaseId(authUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const existing = await db.query.streams.findFirst({
      where: eq(streams.userId, dbUser.id),
      orderBy: [desc(streams.createdAt)],
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Crée d'abord un live Mux (POST /api/stream/mux)" },
        { status: 400 }
      );
    }

    await db
      .update(streams)
      .set({
        status,
        title: title || existing.title,
        startedAt: status === "live" ? new Date() : existing.startedAt,
        endedAt: status === "offline" ? new Date() : null,
        updatedAt: new Date(),
        muxPlaybackId: dbUser.muxPlaybackId || existing.muxPlaybackId,
        muxLiveStreamId: dbUser.muxLiveStreamId || existing.muxLiveStreamId,
      })
      .where(eq(streams.id, existing.id));

    if (status === "offline" && dbUser.muxLiveStreamId) {
      // Keep live input; just mark offline. Uncomment to fully disable:
      // await disableMuxLiveStream(dbUser.muxLiveStreamId);
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[MUX_STATUS]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
