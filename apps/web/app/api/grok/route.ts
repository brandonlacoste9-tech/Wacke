import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { prompt, system, model = "grok-2-1212", maxTokens = 300 } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "XAI_API_KEY not configured" }, { status: 500 });
    }

    const messages = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
      console.error("[GROK API ERROR]", errorText);
      return NextResponse.json({ error: "Grok API request failed" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Grok had nothing to say (weird).";

    return NextResponse.json({ content, usage: data.usage });
  } catch (error) {
    console.error("[GROK ROUTE ERROR]", error);
    return NextResponse.json({ error: "Internal error calling Grok" }, { status: 500 });
  }
}
