import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId, deductTokens } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

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
        if (!authError && authUser) authUserId = authUser.id;
      } catch (e) {
        console.error("[BET_AUTH_EXCEPTION]", e);
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { betAmount, odds, prediction } = await req.json();

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const user = await getUserBySupabaseId(authUserId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Deduct tokens
    try {
      await deductTokens({
        userId: user.id,
        amount: betAmount,
        reason: `Pari IA: ${prediction.substring(0, 30)}`,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Fonds insuffisants" }, { status: 402 });
    }

    // Server-side random roll
    const win = Math.random() > 0.4;
    const multiplier = parseFloat(odds.replace("x", ""));
    const winAmount = Math.floor(betAmount * multiplier);

    if (win) {
      // Award tokens by using negative deductTokens
      await deductTokens({
        userId: user.id,
        amount: -winAmount,
        reason: `Gains de pari IA: ${prediction.substring(0, 30)}`,
      });
      return NextResponse.json({ success: true, win: true, amount: winAmount });
    }

    return NextResponse.json({ success: true, win: false, amount: betAmount });

  } catch (error) {
    console.error("[BET_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
