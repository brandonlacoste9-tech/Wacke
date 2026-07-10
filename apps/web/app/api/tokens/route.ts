import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId, transferTokens, getUserTokenBalance } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/tokens
 * Returns the authenticated user's current token balance.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const dbUser = await getUserBySupabaseId(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const balance = await getUserTokenBalance(dbUser.id);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error("[TOKENS_GET_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/tokens
 * Handles token transactions: gifting to streamers, Boum! reactions.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (error || !user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const dbUser = await getUserBySupabaseId(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { action, toUserId, streamId, amount, lang } = body as {
      action: "gift" | "boum";
      toUserId: string;
      streamId?: string;
      amount: number;
      lang?: "fr" | "en";
    };
    const isEn = lang !== "fr";

    // ─── Validation ───────────────────────────────────────────────────────
    if (!["gift", "boum"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const BOUM_COST = 5;
    const MIN_GIFT = 10;
    const MAX_GIFT = 10000;

    const txAmount = action === "boum" ? BOUM_COST : amount;

    if (action === "gift" && (txAmount < MIN_GIFT || txAmount > MAX_GIFT)) {
      return NextResponse.json(
        { error: `Le don doit être entre ${MIN_GIFT} et ${MAX_GIFT} tokens` },
        { status: 400 }
      );
    }

    if (dbUser.tokenBalance < txAmount) {
      return NextResponse.json(
        { error: `Solde insuffisant. Tu as ${dbUser.tokenBalance} tokens.` },
        { status: 402 }
      );
    }

    const reason =
      action === "boum"
        ? isEn ? "Boom! reaction 🔥" : "Réaction Boum! 🔥"
        : isEn ? `Gift of ${txAmount} tokens 💜` : `Don de ${txAmount} tokens 💜`;

    // ─── Execute Transfer ─────────────────────────────────────────────────
    await transferTokens({
      fromUserId: dbUser.id,
      toUserId,
      streamId,
      amount: txAmount,
      reason,
    });

    const newBalance = await getUserTokenBalance(dbUser.id);

    return NextResponse.json({
      success: true,
      newBalance,
      message: action === "boum"
        ? (isEn ? "BOOM! 🔥" : "BOUM! 🔥")
        : (isEn ? `${txAmount} tokens sent! 💜` : `${txAmount} tokens envoyés! 💜`),
    });
  } catch (error) {
    console.error("[TOKENS_POST_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
