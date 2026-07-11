import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, getReservedUsername, isSystemBlockedUsername } from "@wacke/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/check-username?username=rakai
 * Returns availability status for signup / claim flows.
 */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim();

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, reason: "too_short" });
  }

  if (username.length > 32) {
    return NextResponse.json({ available: false, reason: "too_long" });
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid_chars" });
  }

  if (isSystemBlockedUsername(username)) {
    return NextResponse.json({ available: false, reason: "blocked" });
  }

  const existing = await getUserByUsername(username);
  if (existing && !String(existing.id).startsWith("kick-mock-streamer-")) {
    return NextResponse.json({ available: false, reason: "taken" });
  }

  const reserved = getReservedUsername(username);
  if (reserved) {
    if (reserved.status === "held") {
      return NextResponse.json({ available: false, reason: "held", reserved });
    }
    if (reserved.status === "claimed") {
      return NextResponse.json({ available: false, reason: "claimed", reserved });
    }
    return NextResponse.json({ available: true, reason: "reserved_for_you", reserved });
  }

  return NextResponse.json({ available: true, reason: "available" });
}