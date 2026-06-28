import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { db, users, tokenTransactions } from "@wacke/db";
import { and, eq, desc, gt, sql } from "drizzle-orm";

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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, authUser.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Check if the user has claimed in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastClaim = await db.query.tokenTransactions.findFirst({
      where: and(
        eq(tokenTransactions.toUserId, dbUser.id),
        eq(tokenTransactions.type, "earn"),
        eq(tokenTransactions.reason, "Récompense quotidienne"),
        gt(tokenTransactions.createdAt, oneDayAgo)
      ),
      orderBy: [desc(tokenTransactions.createdAt)],
    });

    if (lastClaim) {
      const nextAvailableTime = new Date(lastClaim.createdAt.getTime() + 24 * 60 * 60 * 1000);
      const diffMs = nextAvailableTime.getTime() - Date.now();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `Déjà réclamé! Reviens dans environ ${diffHours} heure(s).` },
        { status: 429 }
      );
    }

    const CLAIM_AMOUNT = 500;

    // Perform transaction: credit user balance and log transaction
    await db.transaction(async (tx) => {
      // Credit user
      await tx
        .update(users)
        .set({ tokenBalance: sql`${users.tokenBalance} + ${CLAIM_AMOUNT}` })
        .where(eq(users.id, dbUser.id));

      // Log ledger entry
      await tx.insert(tokenTransactions).values({
        toUserId: dbUser.id,
        type: "earn",
        amount: CLAIM_AMOUNT,
        reason: "Récompense quotidienne",
      });
    });

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, dbUser.id),
    });

    return NextResponse.json({
      success: true,
      newBalance: updatedUser?.tokenBalance ?? (dbUser.tokenBalance + CLAIM_AMOUNT),
      message: `Félicitations! +${CLAIM_AMOUNT} tokens réclamés! 🪙`,
    });
  } catch (error) {
    console.error("[TOKENS_CLAIM_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
