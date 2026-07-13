import { NextRequest, NextResponse } from "next/server";
import {
  RATE_LIMITS,
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { moderatePublicText } from "@/lib/moderation";

export const runtime = "nodejs";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`ai:ip:${ip}`, RATE_LIMITS.ai);
    if (!rl.ok) {
      const r = rateLimitResponse(rl, false);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const { prompt, system, lang, model = "meta-llama/llama-3.1-8b-instruct", maxTokens = 300 } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > 4000) {
      return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
    }

    const mod = moderatePublicText(prompt.slice(0, 500));
    if (!mod.allowed && mod.code === "HARD_BLOCK") {
      return NextResponse.json({ error: "Prompt not allowed" }, { status: 422 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) {
      const fallbackLang = lang || (prompt.toLowerCase().includes(" le ") || prompt.toLowerCase().includes(" la ") ? "fr" : "en");
      const frFallbacks = [
        "J'ai muté le streamer, il parlait trop.",
        "Le chat est on fire, mais moi je suis en pause café.",
        "Erreur 404: Mon respect pour ce gameplay est introuvable."
      ];
      const enFallbacks = [
        "I muted the streamer, they were talking too much.",
        "Chat is on fire, but I'm on a coffee break.",
        "Error 404: My respect for this gameplay could not be found."
      ];
      const fallbacks = fallbackLang === "fr" ? frFallbacks : enFallbacks;
      const content = fallbacks[Math.floor(Math.random() * fallbacks.length)] + " — Wacké AI";
      return NextResponse.json({ content, usage: { total_tokens: 0 } });
    }

    const messages = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://wacke.live",
        "X-Title": "Wacké",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI API ERROR]", errorText);
      const fallbackLang = lang || (prompt.toLowerCase().includes(" le ") || prompt.toLowerCase().includes(" la ") ? "fr" : "en");
      const frFallbacks = [
        "J'ai muté le streamer, il parlait trop.",
        "Le chat est on fire, mais moi je suis en pause café.",
        "Erreur 404: Mon respect pour ce gameplay est introuvable."
      ];
      const enFallbacks = [
        "I muted the streamer, they were talking too much.",
        "Chat is on fire, but I'm on a coffee break.",
        "Error 404: My respect for this gameplay could not be found."
      ];
      const fallbacks = fallbackLang === "fr" ? frFallbacks : enFallbacks;
      const content = fallbacks[Math.floor(Math.random() * fallbacks.length)] + " — Wacké AI";
      return NextResponse.json({ content, usage: { total_tokens: 0 } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "AI had nothing to say (weird).";

    return NextResponse.json({ content, usage: data.usage });
  } catch (error) {
    console.error("[AI ROUTE ERROR]", error);
    return NextResponse.json({ error: "Internal error calling AI" }, { status: 500 });
  }
}
