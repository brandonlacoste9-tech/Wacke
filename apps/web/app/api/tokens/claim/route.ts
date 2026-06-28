import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId, claimDailyTokenReward } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * POST /api/tokens/claim
 * Awards the user 500 tokens as a daily login bonus, maximum once every 24 hours.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAdmin();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const dbUser = await getUserBySupabaseId(authUser.id);

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
