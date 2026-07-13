import { NextRequest, NextResponse } from "next/server";
import { addTokens } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sandbox-only mock checkout credit.
 * DISABLED in production — was a free token mint vulnerability.
 */
export async function GET(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  const allowMock =
    process.env.NODE_ENV !== "production" &&
    (stripeSecret.startsWith("sk_test_mock") ||
      process.env.ALLOW_TOKEN_MOCK_CHECKOUT === "true");

  if (!allowMock) {
    return NextResponse.json(
      { error: "Mock checkout is disabled" },
      { status: 404 }
    );
  }

  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("userId");
    const amountStr = searchParams.get("amount");

    if (!userId || !amountStr) {
      return NextResponse.json(
        { error: "Missing mock success parameters" },
        { status: 400 }
      );
    }

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0 || amount > 25000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await addTokens({
      userId,
      amount,
      reason: `Achat de jetons (Simulé Sandbox) : +${amount.toLocaleString()} 🪙`,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/?stripe-success=true`);
  } catch (err: unknown) {
    console.error("[Mock success route error]", err);
    return NextResponse.json(
      { error: "Failed to process sandbox payout" },
      { status: 500 }
    );
  }
}
