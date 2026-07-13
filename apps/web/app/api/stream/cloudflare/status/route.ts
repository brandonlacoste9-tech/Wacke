import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, streams, getUserBySupabaseId } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/cloudflare/status
 * Body: { status: "live" | "offline" }
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
        { error: "Aucun stream — démarre d'abord une diffusion" },
        { status: 400 }
      );
    }

    await db
      .update(streams)
      .set({
        status,
        startedAt: status === "live" ? new Date() : existing.startedAt,
        endedAt: status === "offline" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, existing.id));

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[STREAM_STATUS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
