import { NextRequest, NextResponse } from "next/server";
import { addTokens } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tokens/checkout/mock-success
 * Sandbox simulated endpoint. Credits the tokens directly to the DB and redirects to homepage.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("userId");
    const amountStr = searchParams.get("amount");

    if (!userId || !amountStr) {
      return NextResponse.json({ error: "Missing mock success parameters" }, { status: 400 });
    }

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Call addTokens to securely transaction and save in DB
    await addTokens({
      userId,
      amount,
      reason: `Achat de jetons (Simulé Sandbox) : +${amount.toLocaleString()} 🪙`,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Redirect back to main page with stripe-success query param
    return NextResponse.redirect(`${appUrl}/?stripe-success=true`);
  } catch (err: any) {
    console.error("[Mock success route error]", err);
    return NextResponse.json({ error: "Failed to process sandbox payout" }, { status: 500 });
  }
}
