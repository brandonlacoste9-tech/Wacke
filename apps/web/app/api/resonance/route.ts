import { NextRequest, NextResponse } from "next/server";
import { getOrCreateResonanceChamber, createResonanceEvent, transitionResonancePhase } from "@wacke/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId } from "@wacke/db";
import { db } from "@wacke/db";
import { eq, and, sql } from "drizzle-orm";
import { resonanceChambers } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helper to execute lazy decay in serverless environment.
 * Calculates elapsed seconds and decays the meter value before returning.
 */
function phaseFromValue(val: number): "calm" | "rising" | "critical" | "overload" {
  if (val >= 100) return "overload";
  if (val >= 75) return "critical";
  if (val >= 40) return "rising";
  return "calm";
}

async function getDecayedChamber(slug: string) {
  const chamber = await getOrCreateResonanceChamber(slug);
  if (!chamber) return null;

  const currentVal = parseFloat(String(chamber.meterValue));
  if (Number.isNaN(currentVal) || currentVal <= 0 || chamber.phase === "overload") {
    return chamber;
  }

  // Calculate elapsed seconds since last update
  const lastUpdated = new Date(chamber.updatedAt).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - lastUpdated) / 1000);

  if (elapsedSeconds < 0.5) {
    return chamber;
  }

  const decayRate = parseFloat(String(chamber.decayRate ?? "2.00")) || 2;
  const decayAmount = elapsedSeconds * decayRate;
  const newVal = Math.max(0, currentVal - decayAmount);
  const newPhase = phaseFromValue(newVal);

  // Prefer in-memory mock store when present (dev/mock chambers also use UUID ids)
  const mockList = (globalThis as any).mockResonanceChambers as any[] | undefined;
  const mockChamber = mockList?.find((c: any) => c.slug === slug);
  if (mockChamber) {
    mockChamber.meterValue = newVal.toFixed(2);
    mockChamber.phase = newPhase;
    mockChamber.updatedAt = new Date();
    return mockChamber;
  }

  // Real DB lazy-decay write
  try {
    const [updated] = await db
      .update(resonanceChambers)
      .set({
        meterValue: newVal.toFixed(2),
        phase: newPhase as any,
        updatedAt: new Date(),
      })
      .where(eq(resonanceChambers.slug, slug))
      .returning();

    return updated ?? chamber;
  } catch (err) {
    console.error("[RESONANCE_DECAY_DB_ERROR]", err);
    // Soft-fail: return computed decay without persisting
    return {
      ...chamber,
      meterValue: newVal.toFixed(2),
      phase: newPhase,
      updatedAt: new Date(),
    };
  }
}

/**
 * GET /api/resonance?slug=...
 * Retrieves the current resonance chamber status, performing lazy-decay.
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const chamber = await getDecayedChamber(slug);
    if (!chamber) {
      return NextResponse.json({ error: "Chamber not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, chamber });
  } catch (error) {
    console.error("[RESONANCE_GET_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/resonance
 * Handles manual client pulses or triggers (e.g. from chat reactions or interactive nubs)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, kind = "pulse", intensity = 1.0, metadata = {} } = body as {
      slug: string;
      kind?: "pulse" | "surge" | "chaos" | "gift";
      intensity?: number;
      metadata?: any;
    };

    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    // Optional auth extraction
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const supabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const dbUser = await getUserBySupabaseId(user.id);
          if (dbUser) {
            userId = dbUser.id;
          }
        }
      } catch {}
    }

    const chamber = await createResonanceEvent({
      slug,
      userId,
      kind,
      intensity,
      metadata,
    });

    return NextResponse.json({ success: true, chamber });
  } catch (error) {
    console.error("[RESONANCE_POST_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
