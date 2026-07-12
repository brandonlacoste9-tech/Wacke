import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOUND_COSTS: Record<string, number> = {
  bell: 20,
  coin: 30,
  alarm: 40,
  laser: 50,
};

const SOUND_LABELS: Record<string, string> = {
  bell: "🔔 Cling-Cling",
  coin: "🪙 Coin-Coin",
  alarm: "🚨 Alerte!",
  laser: "⚡ Laser",
};

/**
 * POST /api/chat/sound
 * Deducts tokens and inserts a special [sound]:<type> message in the chat logs.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // Robust auth extraction: support mock-session (Kick/demo), real JWTs, and fallbacks
    let authUserId: string | null = null;

    if (token.startsWith("mock-session:") || token.startsWith("twitch-session:") || token.startsWith("kick-session:")) {
      const parts = token.split(":");
      authUserId = parts.length >= 3 ? parts.slice(2).join(":") : null;
    } else if (token.includes(".")) {
      try {
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
        authUserId = payload.sub || payload.user_id || payload.id || null;
      } catch {}
    }

    if (!authUserId) {
      try {
        const supabase = getSupabaseAdmin();
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (!authError && authUser) {
          authUserId = authUser.id;
        }
      } catch (e) {
        console.error("[SOUND_AUTH_EXCEPTION]", e);
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { soundType, streamId } = await req.json();

    if (!soundType || !streamId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const cost = SOUND_COSTS[soundType];
    if (!cost) {
      return NextResponse.json({ error: "Type de son inconnu" }, { status: 400 });
    }

    const user = await getUserBySupabaseId(authUserId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Check if streamId is a valid UUID
    const isValidStreamId = streamId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(streamId);

    // 1. Deduct tokens for soundboard trigger
    try {
      await deductTokens({
        userId: user.id,
        amount: cost,
        reason: `Déclenchement son: ${SOUND_LABELS[soundType]}`,
        streamId: isValidStreamId ? streamId : undefined,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Fonds insuffisants" },
        { status: 402 }
      );
    }

    // 2. Insert special [sound]: message
    let message;
    if (isValidStreamId) {
      message = await createChatMessage({
        streamId,
        userId: user.id,
        content: `[sound]:${soundType}`,
        isSacre: false,
      });
    } else {
      message = {
        id: `mock-msg-${Date.now()}`,
        streamId,
        userId: user.id,
        content: `[sound]:${soundType}`,
        isSacre: false,
        isDeleted: false,
        createdAt: new Date(),
      };
    }



    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[sound API error]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
