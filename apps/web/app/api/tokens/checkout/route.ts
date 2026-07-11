import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserBySupabaseId } from "@wacke/db";
import Stripe from "stripe";

export const runtime = "nodejs";

const PACKS: Record<number, { cost: number; name: string }> = {
  1000: { cost: 1.99, name: "Chips Pack (1,000 🪙)" },
  5000: { cost: 4.99, name: "Pinte Pack (5,000 🪙)" },
  10000: { cost: 8.99, name: "Boîte de 12 Pack (10,000 🪙)" },
  25000: { cost: 17.99, name: "Gérant Pack (25,000 🪙)" },
};

/**
 * POST /api/tokens/checkout
 * Initiates a Stripe Checkout Session or returns a simulated local sandbox redirection.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseAdmin();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { amount } = await req.json();
    const pack = PACKS[amount];

    if (!pack) {
      return NextResponse.json({ error: "Pack de jetons invalide" }, { status: 400 });
    }

    const user = await getUserBySupabaseId(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_mock";

    // ─── Mode Sandbox Mocks (No Stripe keys or starts with sk_test_mock) ──
    if (stripeSecret.startsWith("sk_test_mock")) {
      console.log(`[Stripe Checkout] Simulating Checkout Session for user ${user.id} (${pack.name})`);
      const mockSuccessUrl = `${appUrl}/api/tokens/checkout/mock-success?userId=${user.id}&amount=${amount}`;
      return NextResponse.json({ url: mockSuccessUrl });
    }

    // ─── Stripe Production Checkout ──────────────────────────────────────────
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-04-10" as any, // standard api version
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: pack.name,
              description: `Recharge ton compte Wacké avec ${amount.toLocaleString()} jetons.`,
            },
            unit_amount: Math.round(pack.cost * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId: user.id,
        amount: amount.toString(),
      },
      success_url: `${appUrl}/?stripe-success=true`,
      cancel_url: `${appUrl}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe checkout session error]", error);
    return NextResponse.json(
      { error: error.message || "Erreur d'initialisation Stripe" },
      { status: 500 }
    );
  }
}
