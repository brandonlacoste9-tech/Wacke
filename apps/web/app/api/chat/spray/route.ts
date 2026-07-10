import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // Robust auth extraction: support mock-session (Kick/demo), real JWTs, and fallbacks
    let authUserId: string | null = null;

    if (token.startsWith("mock-session:") || token.startsWith("twitch-session:") || token.startsWith("kick-session:")) {
      const parts = token.split(":");
      authUserId = parts.length >= 3 ? parts.slice(2).join(":") : null;
    } else if (token.includes(".")) {
      try {
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
        authUserId = payload.sub || payload.user_id || payload.id || null;
      } catch {}
    }

    if (!authUserId) {
      try {
        const supabase = getSupabaseAdmin();
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (!authError && authUser) {
          authUserId = authUser.id;
        }
      } catch (e) {
        console.error("[SPRAY_AUTH_EXCEPTION]", e);
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { prompt, streamId } = await req.json();

    if (!prompt || !streamId) {
      return NextResponse.json(
        { error: "Description ou stream manquant" },
        { status: 400 }
      );
    }

    const user = await getUserBySupabaseId(authUserId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Enhance prompt with real Grok xAI for better AI stickers
    let enhancedPrompt = `graffiti sticker of ${prompt}, die-cut border, vibrant street art style, isolated on clean background, high quality cyberpunk sticker design, bold outline`;
    try {
      const grokRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/grok`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Améliore ce prompt pour générer un sticker graffiti wacké : "${prompt}". Retourne juste le prompt amélioré, court et descriptif.`,
          maxTokens: 60,
        }),
      });
      if (grokRes.ok) {
        const grokData = await grokRes.json();
        if (grokData.content) enhancedPrompt = grokData.content.trim();
      }
    } catch (e) {
      console.log("[GROK SPRAY ENHANCE] using original prompt");
    }

    // Check if streamId is a valid UUID
    const isValidStreamId = streamId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(streamId);

    // 1. Deduct tokens
    try {
      await deductTokens({
        userId: user.id,
        amount: SPRAY_COST,
        reason: `Génération graffiti: ${prompt.substring(0, 30)}`,
        streamId: isValidStreamId ? streamId : undefined,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Fonds insuffisants" },
        { status: 402 }
      );
    }

    // 2. Call Replicate API to generate sticker
    let imageUrl: string | undefined = undefined;
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
            prompt: enhancedPrompt,
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
          streamId: isValidStreamId ? streamId : undefined,
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
        streamId: isValidStreamId ? streamId : undefined,
      });
      return NextResponse.json(
        { error: "Délai d'attente de génération dépassé (Remboursé)" },
        { status: 504 }
      );
    }

    // 3. Save message prefixing with [spray]: so the client renders it as an image
    let message;
    if (isValidStreamId) {
      message = await createChatMessage({
        streamId,
        userId: user.id,
        content: `[spray]:${imageUrl}`,
        isSacre: false,
      });
    } else {
      message = {
        id: `mock-msg-${Date.now()}`,
        streamId,
        userId: user.id,
        content: `[spray]:${imageUrl}`,
        isSacre: false,
        isDeleted: false,
        createdAt: new Date(),
      };
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[SPRAY_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
