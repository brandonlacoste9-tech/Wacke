import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";
import {
  RATE_LIMITS,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

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
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const rl = rateLimit(`costly:u:${authUserId}`, RATE_LIMITS.chatCostly);
    if (!rl.ok) {
      const r = rateLimitResponse(rl);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
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
