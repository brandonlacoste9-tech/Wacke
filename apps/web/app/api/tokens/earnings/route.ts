import { NextRequest, NextResponse } from "next/server";
import { getUserBySupabaseId, getStreamerEarnings } from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tokens/earnings
 * Streamer chaos-share + gift ledger for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const dbUser = await getUserBySupabaseId(authUserId);
    if (!dbUser) {
      // Demo synthetic user — empty ledger
      return NextResponse.json({
        chaosShareTotal: 0,
        giftTotal: 0,
        totalEarned: 0,
        recent: [],
        sharePercent: 30,
        balance: 0,
      });
    }

    const earnings = await getStreamerEarnings(dbUser.id);
    return NextResponse.json({
      ...earnings,
      balance: dbUser.tokenBalance,
      username: dbUser.username,
    });
  } catch (error) {
    console.error("[EARNINGS_GET_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
