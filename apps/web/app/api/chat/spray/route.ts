import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";

export const runtime = "nodejs";

const SPRAY_COST = 100;

/**
 * POST /api/chat/spray
 * Deducts 100 tokens, calls Replicate to generate a graffiti sticker, and saves it in the chat.
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

    const { prompt, streamId } = await req.json();

    if (!prompt || !streamId) {
      return NextResponse.json(
        { error: "Description ou stream manquant" },
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
        amount: SPRAY_COST,
        reason: `Génération graffiti: ${prompt.substring(0, 30)}`,
        streamId,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Fonds insuffisants" },
        { status: 402 }
      );
    }

    // 2. Call Replicate API to generate sticker
    let imageUrl = null;
    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Stability AI SDXL or Flux Schnell
          // Using flux-schnell model as it is lightning fast (< 2 seconds) and generates excellent street art
          version: "0bc9ecc0a3dbb7c1abf486c0d32f2237b50257406ccb1a4353856b3b2f44007b", 
          input: {
            prompt: `graffiti sticker of ${prompt}, die-cut border, vibrant street art style, isolated on clean background, high quality cyberpunk sticker design, bold outline`,
            go_fast: true,
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "webp"
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Replicate creation failed: ${errText}`);
      }

      const prediction = await response.json();
      const pollUrl = prediction.urls.get;

      // Poll the prediction status
      for (let i = 0; i < 20; i++) { // Max 10 seconds (usually takes 1.5 - 2s)
        const pollRes = await fetch(pollUrl, {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          }
        });
        
        const pollData = await pollRes.json();
        
        if (pollData.status === "succeeded") {
          // Check if output is array or string
          imageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
          break;
        }
        
        if (pollData.status === "failed" || pollData.status === "canceled") {
          throw new Error("Generation failed on Replicate");
        }
        
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (apiError) {
      console.error("[REPLICATE_SPRAY_ERROR]", apiError);
      // Refund tokens if generation fails
      try {
        await deductTokens({
          userId: user.id,
          amount: -SPRAY_COST,
          reason: "Remboursement: Échec génération graffiti",
          streamId,
        });
      } catch (refundError) {
        console.error("[REFUND_ERROR]", refundError);
      }
      return NextResponse.json(
        { error: "Échec de génération par l'IA (Remboursé)" },
        { status: 500 }
      );
    }

    if (!imageUrl) {
      // Refund if no image returned
      await deductTokens({
        userId: user.id,
        amount: -SPRAY_COST,
        reason: "Remboursement: Pas d'image retournée",
        streamId,
      });
      return NextResponse.json(
        { error: "Délai d'attente de génération dépassé (Remboursé)" },
        { status: 504 }
      );
    }

    // 3. Save message prefixing with [spray]: so the client renders it as an image
    const message = await createChatMessage({
      streamId,
      userId: user.id,
      content: `[spray]:${imageUrl}`,
      isSacre: false,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[SPRAY_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
