import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServiceRole } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tts/system
 * System (free for viewers) Grok xAI Voice TTS for CoHost, HotTakes, Fire, events, etc.
 * Uses service-role to upload to public 'audio' bucket under system/ prefix.
 * No user token deduction. Called internally by Grok components.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, lang = "en" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const xaiKey = process.env.XAI_API_KEY;
    if (!xaiKey) {
      return NextResponse.json({ error: "XAI_API_KEY not configured" }, { status: 500 });
    }

    // Map lang to xAI supported
    const language = lang === "fr" ? "fr" : "en";

    const ttsResponse = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 800), // safety cap for system utterances
        voice_id: "leo", // energetic default, or "eve"/"rex" etc. Good for hype
        language,
        output_format: {
          codec: "mp3",
          sample_rate: 44100,
        },
        speed: 1.05,
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error("[SYSTEM_TTS_ERROR]", ttsResponse.status, errText);
      return NextResponse.json({ error: "Grok TTS failed" }, { status: 502 });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // Strict service role for RLS bypass on storage (system/ prefix is server-controlled).
    const supabaseAdmin = getSupabaseServiceRole();
    const bucket = "audio";

    // Ensure public bucket (safe no-op if exists)
    try {
      await supabaseAdmin.storage.createBucket(bucket, { public: true });
    } catch (_) {}

    // System folder for Grok voice outputs (CoHost, HotTakes, Fire, etc).
    // Uploaded exclusively via service role (getSupabaseServiceRole), which bypasses RLS.
    // Public bucket + getPublicUrl makes playback work for everyone.
    const fileName = `system/grok/${Date.now()}-${Math.random().toString(36).substring(2)}.mp3`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, Buffer.from(audioBuffer), {
        contentType: "audio/mpeg",
        upsert: false,
      });

    let audioUrl: string | null = null;
    if (uploadError) {
      console.error("[SYSTEM_TTS_STORAGE]", uploadError);
      // Fallback to data URL for immediate playback (short clips ok)
      const base64 = Buffer.from(audioBuffer).toString("base64");
      audioUrl = `data:audio/mpeg;base64,${base64}`;
    } else {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName);
      audioUrl = publicUrlData.publicUrl;
    }

    return NextResponse.json({ success: true, audioUrl });
  } catch (error) {
    console.error("[SYSTEM_TTS_ROUTE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
