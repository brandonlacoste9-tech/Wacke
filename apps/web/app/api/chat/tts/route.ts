import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServiceRole } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTS_COST = 50;

/**
 * POST /api/chat/tts
 * Deducts tokens, uses native Grok xAI Voice (TTS) to generate expressive audio, uploads to Supabase, and saves the message.
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

    const { content, streamId, isSacre, voiceId = "leo", lang = "fr" } = await req.json();

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

    // 2. Generate TTS via Grok xAI Voice (native Grok AI voice!)
    let audioUrl = null;
    try {
      const xaiKey = process.env.XAI_API_KEY;
      if (!xaiKey) {
        throw new Error("XAI_API_KEY not configured for Grok TTS");
      }

      const ttsResponse = await fetch("https://api.x.ai/v1/tts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${xaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: content,
          voice_id: voiceId, // e.g. "leo", "eve", "ara", "rex", "sal"
          language: lang === "en" ? "en" : "fr",  // pass through from UI lang toggle (Quebec French default)
          output_format: {
            codec: "mp3",
            sample_rate: 44100,
          },
          speed: 1.05, // slightly energetic
        }),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        console.error("[GROK_TTS_ERROR]", ttsResponse.status, errText);
        throw new Error("Grok TTS generation failed");
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      
      // Upload to Supabase Storage for persistent public URL (chat playback)
      // Use strict service role so we bypass RLS reliably (matches policy expectation of auth.uid() first segment).
      const supabaseAdmin = getSupabaseServiceRole();
      const bucket = "audio";
      
      // Ensure bucket exists (idempotent).
      // IMPORTANT: Run this complete SQL ONCE in Supabase SQL Editor:
      /*
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('audio', 'audio', true)
      ON CONFLICT (id) DO UPDATE
      SET public = EXCLUDED.public, name = EXCLUDED.name;

      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- User-owned audio (paid TTS messages etc). UUID must be FIRST segment.
      CREATE POLICY "Users can upload audio to their folder"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

      CREATE POLICY "Users can update their own audio"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

      CREATE POLICY "Users can delete their own audio"
      ON storage.objects FOR DELETE TO authenticated
      USING ( bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text );

      CREATE POLICY "Users can select their own audio"
      ON storage.objects FOR SELECT TO authenticated
      USING ( bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text );
      */

      try {
        await supabaseAdmin.storage.createBucket(bucket, { public: true });
      } catch (e) {
        // bucket already exists or permission ok (public bucket + service role uploads bypass RLS)
      }

      // Object names MUST be "<supabase-auth-uid>/tts/filename.mp3" (first folder segment = auth.uid() for RLS)
      // Example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/tts/1720123456789-abc123.mp3"
      // Object path for RLS: first folder segment MUST be the auth uid.
      // ✅ "{USER_UUID}/tts/....mp3"
      // We use authUser.id (the Supabase auth uid from the validated token).
      // All uploads here go through getSupabaseServiceRole() (bypasses RLS).
      const fileName = `${authUser.id}/tts/${Date.now()}-${Math.random().toString(36).substring(2)}.mp3`;
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, Buffer.from(audioBuffer), {
          contentType: "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("[GROK_TTS_STORAGE_ERROR]", uploadError);
        // Fallback: data URL (works for demo, large messages may be heavy)
        const base64 = Buffer.from(audioBuffer).toString("base64");
        audioUrl = `data:audio/mpeg;base64,${base64}`;
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(fileName);
        audioUrl = publicUrlData.publicUrl;
      }
    } catch (ttsError) {
      console.error("[GROK_TTS_ERROR]", ttsError);
      // Refund tokens if TTS fails
      await deductTokens({
        userId: user.id,
        amount: -TTS_COST,
        reason: "Remboursement: erreur TTS",
        streamId,
      });
      return NextResponse.json(
        { error: "Erreur de génération vocale Grok (Remboursé)" },
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

    // 4. Broadcast via Supabase Realtime so chat rooms and overlays catch it instantly
    const hydratedMessage = {
      ...message,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };

    await supabase.channel(`graffiti-chat:${streamId}`).send({
      type: "broadcast",
      event: "chat_message",
      payload: hydratedMessage,
    });

    return NextResponse.json({ success: true, message: hydratedMessage });
  } catch (error) {
    console.error("[TTS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
