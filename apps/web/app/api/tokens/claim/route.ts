import { NextRequest, NextResponse } from "next/server";
import { getUserBySupabaseId, claimDailyTokenReward } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";
import {
  RATE_LIMITS,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tokens/claim
 * Awards the user 500 tokens as a daily login bonus, maximum once every 24 hours.
 */
export async function POST(req: NextRequest) {
  try {
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const rl = rateLimit(`claim:u:${authUserId}`, RATE_LIMITS.claim);
    if (!rl.ok) {
      const r = rateLimitResponse(rl);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const dbUser = await getUserBySupabaseId(authUserId);

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const result = await claimDailyTokenReward(dbUser.id);

    if (!result.success) {
      const nextAvailableTime = new Date(result.lastClaimDate!.getTime() + 24 * 60 * 60 * 1000);
      const diffMs = nextAvailableTime.getTime() - Date.now();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `Déjà réclamé! Reviens dans environ ${diffHours} heure(s).` },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      message: `Félicitations! +500 tokens réclamés! 🪙`,
    });
  } catch (error) {
    console.error("[TOKENS_CLAIM_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
