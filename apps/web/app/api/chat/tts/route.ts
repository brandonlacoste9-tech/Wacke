import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const runtime = "nodejs";

const TTS_COST = 50;

/**
 * POST /api/chat/tts
 * Deducts tokens, runs Higgsfield CLI to generate TTS, and saves the message.
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

    const { content, streamId, isSacre } = await req.json();

    if (!content || !streamId) {
      return NextResponse.json(
        { error: "Message ou stream manquant" },
        { status: 400 }
      );
    }

    const user = await getUserBySupabaseId(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // 1. Deduct tokens
    try {
      await deductTokens({
        userId: user.id,
        amount: TTS_COST,
        reason: "Message vocal TTS",
        streamId,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Fonds insuffisants" },
        { status: 402 }
      );
    }

    // 2. Generate TTS via Higgsfield CLI
    let audioUrl = null;
    try {
      // Escape double quotes for shell safety
      const safeContent = content.replace(/"/g, '\\"');
      const cmd = `higgsfield generate create inworld_text_to_speech --prompt "${safeContent}" --voice "Mathieu (fr)" --wait --json`;
      
      const { stdout } = await execAsync(cmd);
      const jsonResponse = JSON.parse(stdout);
      
      // Expected output is an array of jobs, grab the first one
      if (Array.isArray(jsonResponse) && jsonResponse[0]?.result_url) {
        audioUrl = jsonResponse[0].result_url;
      }
    } catch (cliError) {
      console.error("[TTS_CLI_ERROR]", cliError);
      // Refund tokens if TTS fails
      await deductTokens({
        userId: user.id,
        amount: -TTS_COST,
        reason: "Remboursement: erreur TTS",
        streamId,
      });
      return NextResponse.json(
        { error: "Erreur de génération vocale (Remboursé)" },
        { status: 500 }
      );
    }

    // 3. Save message with audioUrl
    const message = await createChatMessage({
      streamId,
      userId: user.id,
      content,
      isSacre: !!isSacre,
      audioUrl,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[TTS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
