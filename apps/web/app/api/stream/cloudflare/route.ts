import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, streams, getUserBySupabaseId } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/cloudflare
 * Create a Cloudflare Stream live input (WHIP) for browser go-live.
 */
export async function POST(req: NextRequest) {
  try {
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

    if (!accountId || !apiToken) {
      return NextResponse.json(
        {
          error: "Configuration Cloudflare manquante",
          hint: "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN",
        },
        { status: 503 }
      );
    }

    const dbUser = await getUserBySupabaseId(authUserId);
    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: { name: `Wacke:${dbUser.username}` },
          recording: { mode: "automatic" },
        }),
      }
    );

    if (!cfResponse.ok) {
      const err = await cfResponse.text();
      console.error("[CF_STREAM_ERROR]", err);
      return NextResponse.json({ error: "Erreur Cloudflare" }, { status: 500 });
    }

    const cfData = (await cfResponse.json()) as {
      result: {
        uid: string;
        webRTC?: { url?: string };
        rtmps?: { url?: string; streamKey?: string };
      };
    };
    const liveInput = cfData.result;
    const whipUrl = liveInput.webRTC?.url;
    const playbackId = liveInput.uid;

    if (!whipUrl) {
      return NextResponse.json(
        { error: "Cloudflare n'a pas renvoyé d'URL WHIP" },
        { status: 500 }
      );
    }

    const existing = await db.query.streams.findFirst({
      where: eq(streams.userId, dbUser.id),
      orderBy: [desc(streams.createdAt)],
    });

    if (existing) {
      await db
        .update(streams)
        .set({
          cloudflareStreamId: liveInput.uid,
          cloudflarePlaybackId: playbackId,
          status: "offline",
          updatedAt: new Date(),
        })
        .where(eq(streams.id, existing.id));
    } else {
      await db.insert(streams).values({
        userId: dbUser.id,
        title: `Live ${dbUser.displayName}`,
        status: "offline",
        cloudflareStreamId: liveInput.uid,
        cloudflarePlaybackId: playbackId,
      });
    }

    return NextResponse.json({
      success: true,
      whipUrl,
      playbackId,
      rtmpsUrl: liveInput.rtmps?.url,
      rtmpsStreamKey: liveInput.rtmps?.streamKey,
    });
  } catch (error) {
    console.error("[STREAM_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
