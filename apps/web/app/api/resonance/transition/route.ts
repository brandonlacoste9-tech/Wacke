import { NextRequest, NextResponse } from "next/server";
import { transitionResonancePhase } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/resonance/transition
 * Allows transition overrides (e.g. client resetting overload back to calm after lock timer).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, phase } = body as {
      slug: string;
      phase: "calm" | "rising" | "critical" | "overload";
    };

    if (!slug || !phase) {
      return NextResponse.json({ error: "slug and phase required" }, { status: 400 });
    }

    if (!["calm", "rising", "critical", "overload"].includes(phase)) {
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }

    const chamber = await transitionResonancePhase(slug, phase);
    return NextResponse.json({ success: true, chamber });
  } catch (error) {
    console.error("[RESONANCE_TRANSITION_POST_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
