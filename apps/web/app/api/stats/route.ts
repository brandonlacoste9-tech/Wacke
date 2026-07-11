import { NextResponse } from "next/server";
import { fetchPlatformStats } from "@/lib/stream-aggregator";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await fetchPlatformStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[api/stats]", err);
    return NextResponse.json(
      { liveChannels: 0, totalViewers: 0, wackeChannels: 0, boomCount: 0 },
      { status: 200 }
    );
  }
}