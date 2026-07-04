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

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAdmin();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
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

    const user = await getUserBySupabaseId(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 1. Deduct tokens for soundboard trigger
    try {
      await deductTokens({
        userId: user.id,
        amount: cost,
        reason: `Déclenchement son: ${SOUND_LABELS[soundType]}`,
        streamId,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Fonds insuffisants" },
        { status: 402 }
      );
    }

    // 2. Insert special [sound]: message
    const message = await createChatMessage({
      streamId,
      userId: user.id,
      content: `[sound]:${soundType}`,
      isSacre: false,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[sound API error]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
