import { NextRequest, NextResponse } from "next/server";
import { addTokens } from "@wacke/db";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Stripe Webhook event receiver.
 */
export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2024-04-10" as any,
  });

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook signature failure]`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle successful checkouts
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const amountStr = session.metadata?.amount;

    if (userId && amountStr) {
      const amount = parseInt(amountStr, 10);
      if (!isNaN(amount) && amount > 0) {
        try {
          await addTokens({
            userId,
            amount,
            reason: `Achat de jetons (Stripe) : +${amount.toLocaleString()} 🪙`,
          });
          console.log(`[Stripe Webhook] Successfully credited user ${userId} with ${amount} tokens.`);
        } catch (dbErr) {
          console.error(`[Stripe Webhook] Database credit failed`, dbErr);
          return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
