import { NextRequest, NextResponse } from "next/server";
import { WackeBotManager } from "@/lib/wacke-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/bot/control
 * Returns the current runtime status of WackeBot.
 */
export async function GET() {
  try {
    const bot = WackeBotManager.getInstance();
    return NextResponse.json(bot.getStatus());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/bot/control
 * Triggers start or stop actions on the bot manager.
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    const bot = WackeBotManager.getInstance();

    if (action === "start") {
      // Do not block the response while connecting IRC
      bot.start().catch((err) => {
        console.error("[Bot control start async error]", err);
      });
      return NextResponse.json({ message: "Démarrage du bot lancé", status: bot.getStatus() });
    }

    if (action === "stop") {
      await bot.stop();
      return NextResponse.json({ message: "Bot arrêté avec succès", status: bot.getStatus() });
    }

    return NextResponse.json({ error: "Action invalide. Utilise 'start' ou 'stop'" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
