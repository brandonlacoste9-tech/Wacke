import { NextResponse } from "next/server";
import { getDailyTopSpenders } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 30; // cache for 30 seconds

/**
 * GET /api/tokens/top-spenders
 * Returns the top 5 spenders of the last 24h.
 */
export async function GET() {
  try {
    const spenders = await getDailyTopSpenders(5);
    return NextResponse.json({ spenders });
  } catch (err) {
    console.error("[top-spenders API error]", err);
    return NextResponse.json({ error: "Failed to fetch top spenders" }, { status: 500 });
  }
}
