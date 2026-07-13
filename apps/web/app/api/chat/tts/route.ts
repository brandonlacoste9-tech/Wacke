import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServiceRole } from "@/lib/supabase/server";
import {
  getUserBySupabaseId,
  createChatMessage,
  deductTokens,
} from "@wacke/db";
import { resolveAuthUserId } from "@/lib/auth-api";
import {
  RATE_LIMITS,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { moderateMessage } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTS_COST = 50;

/**
 * POST /api/chat/tts
 * Deducts tokens, uses native AI xAI Voice (TTS) to generate expressive audio, uploads to Supabase, and saves the message.
 */
export async function POST(req: NextRequest) {
  try {
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const rl = rateLimit(`costly:u:${authUserId}`, RATE_LIMITS.chatCostly);
    if (!rl.ok) {
      const r = rateLimitResponse(rl);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const { content, streamId, isSacre, voiceId = "leo", lang = "en" } = await req.json();
    if (typeof content === "string") {
      const mod = moderateMessage(content, Boolean(isSacre));
      if (!mod.allowed) {
        return NextResponse.json(
          { error: mod.reason || "Contenu non permis" },
          { status: 422 }
        );
      }
    }

    if (!content || !streamId) {
      return NextResponse.json(
        { error: "Message ou stream manquant" },
        { status: 400 }
      );
    }

    const user = await getUserBySupabaseId(authUserId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Get admin client for realtime broadcast (and was previously used for auth)
    const supabase = getSupabaseAdmin();

    // Check if streamId is a valid UUID (mock streams from Kick use non-uuid strings)
    const isValidStreamId = streamId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(streamId);

    // 1. Generate TTS first (only deduct on success to avoid charging for failures)
    let audioUrl: string | undefined = undefined;
    let ttsSucceeded = false;
    try {
      const xaiKey = process.env.XAI_API_KEY;
      if (!xaiKey) {
        throw new Error("XAI_API_KEY not configured for AI TTS");
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
          language: lang === "fr" ? "fr" : "en", // follows UI language toggle
          output_format: {
            codec: "mp3",
            sample_rate: 44100,
          },
          speed: 1.05, // slightly energetic
        }),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        console.error("[AI_TTS_ERROR]", ttsResponse.status, errText);
        throw new Error("AI TTS generation failed");
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
      // We use authUserId (the Supabase auth uid from the validated token).
      // All uploads here go through getSupabaseServiceRole() (bypasses RLS).
      const fileName = `${authUserId}/tts/${Date.now()}-${Math.random().toString(36).substring(2)}.mp3`;
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, Buffer.from(audioBuffer), {
          contentType: "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("[AI_TTS_STORAGE_ERROR]", uploadError);
        // Fallback: data URL (works for demo, large messages may be heavy)
        const base64 = Buffer.from(audioBuffer).toString("base64");
        audioUrl = `data:audio/mpeg;base64,${base64}`;
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(fileName);
        audioUrl = publicUrlData.publicUrl;
      }
      ttsSucceeded = true;
    } catch (ttsError) {
      console.error("[AI_TTS_ERROR]", ttsError);
      audioUrl = undefined;
      ttsSucceeded = false;
    }

    // 2. Deduct tokens ONLY if TTS succeeded
    if (ttsSucceeded) {
      try {
        await deductTokens({
          userId: user.id,
          amount: TTS_COST,
          reason: "Message vocal TTS",
          streamId: isValidStreamId ? streamId : undefined,
        });
      } catch (err: any) {
        // If funds issue after successful TTS (rare race), don't attach audio
        audioUrl = undefined;
        ttsSucceeded = false;
      }
    }

    // 3. Save message with audioUrl (only if it's a real stream)
    let message;
    if (isValidStreamId) {
      message = await createChatMessage({
        streamId,
        userId: user.id,
        content,
        isSacre: !!isSacre,
        audioUrl,
      });
    } else {
      // Mock message for fallback Kick streams
      message = {
        id: `mock-msg-${Date.now()}`,
        streamId,
        userId: user.id,
        content,
        isSacre: !!isSacre,
        audioUrl,
        isDeleted: false,
        createdAt: new Date(),
      };
    }

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
