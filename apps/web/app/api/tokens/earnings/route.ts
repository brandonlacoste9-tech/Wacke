import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId, getStreamerEarnings } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tokens/earnings
 * Streamer chaos-share + gift ledger for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    let authUserId: string | null = null;

    if (
      token.startsWith("mock-session:") ||
      token.startsWith("twitch-session:") ||
      token.startsWith("kick-session:")
    ) {
      const parts = token.split(":");
      authUserId = parts.length >= 3 ? parts.slice(2).join(":") : null;
    } else {
      try {
        const supabase = getSupabaseAdmin();
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        authUserId = user?.id ?? null;
      } catch {
        /* fallthrough */
      }
    }

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
