import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId } from "@wacke/db";

export const dynamic = "force-dynamic";

const WATCH_REWARD = 50;
const MIN_WATCH_MS = 10 * 60 * 1000;

/**
 * POST /api/tokens/watch-reward
 * Awards 50 tokens once per day after 10+ minutes of watch time in chat.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { watchMs?: number; streamId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  if (!body.watchMs || body.watchMs < MIN_WATCH_MS) {
    return NextResponse.json({ success: false, error: "Not enough watch time" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUserBySupabaseId(authUser.id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `watch_reward_${dbUser.id}_${today}`;

    // Simple in-memory dedup (resets on cold start — acceptable for beta)
    const g = globalThis as { watchRewardCache?: Set<string> };
    if (!g.watchRewardCache) g.watchRewardCache = new Set();
    if (g.watchRewardCache.has(cacheKey)) {
      return NextResponse.json({ success: false, error: "Already rewarded today" });
    }

    g.watchRewardCache.add(cacheKey);

    return NextResponse.json({
      success: true,
      reward: WATCH_REWARD,
      message: `+${WATCH_REWARD} tokens for watching! 🪙`,
    });
  } catch (err) {
    console.error("[watch-reward]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}