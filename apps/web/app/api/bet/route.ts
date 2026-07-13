import { NextRequest, NextResponse } from "next/server";
import { getUserBySupabaseId, deductTokens } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";
import {
  RATE_LIMITS,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Server-only odds options (client cannot choose arbitrary multipliers) */
const ALLOWED_ODDS = [1.5, 2.0] as const;
const MAX_BET = 500;
const MIN_BET = 10;
/** House edge: win probability ~40% */
const WIN_CHANCE = 0.4;

/**
 * POST /api/bet
 * Optional chaos betting. Disabled when BETTING_ENABLED=false (default in production).
 */
export async function POST(req: NextRequest) {
  try {
    if (
      process.env.BETTING_ENABLED !== "true" &&
      process.env.NODE_ENV === "production"
    ) {
      return NextResponse.json(
        { error: "Les paris sont temporairement désactivés" },
        { status: 403 }
      );
    }

    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const rl = rateLimit(`bet:u:${authUserId}`, RATE_LIMITS.bet);
    if (!rl.ok) {
      const r = rateLimitResponse(rl);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const body = await req.json();
    const betAmount = Number(body.betAmount);
    const prediction =
      typeof body.prediction === "string"
        ? body.prediction.slice(0, 80)
        : "pari";

    // Ignore client odds — pick from allowlist only
    let odds = 1.5;
    if (typeof body.odds === "string" || typeof body.odds === "number") {
      const raw = parseFloat(String(body.odds).replace("x", ""));
      if (ALLOWED_ODDS.includes(raw as (typeof ALLOWED_ODDS)[number])) {
        odds = raw;
      }
    }

    if (!Number.isFinite(betAmount) || betAmount < MIN_BET || betAmount > MAX_BET) {
      return NextResponse.json(
        { error: `Mise entre ${MIN_BET} et ${MAX_BET} jetons` },
        { status: 400 }
      );
    }

    const user = await getUserBySupabaseId(authUserId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    try {
      await deductTokens({
        userId: user.id,
        amount: Math.floor(betAmount),
        reason: `Pari: ${prediction}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fonds insuffisants";
      return NextResponse.json({ error: message }, { status: 402 });
    }

    const win = Math.random() < WIN_CHANCE;
    const winAmount = Math.floor(betAmount * odds);

    if (win) {
      await deductTokens({
        userId: user.id,
        amount: -winAmount,
        reason: `Gains pari: ${prediction}`,
      });
      return NextResponse.json({
        success: true,
        win: true,
        amount: winAmount,
        odds,
      });
    }

    return NextResponse.json({
      success: true,
      win: false,
      amount: betAmount,
      odds,
    });
  } catch (error) {
    console.error("[BET_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
