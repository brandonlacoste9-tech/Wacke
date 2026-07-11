/**
 * Wacké AI Wit Engine
 *
 * Wacké AI touch: fun, maximally truthful, slightly chaotic AI responses.
 * Uses real API calls to `/api/ai` to generate dynamic content.
 */

// Real AI call via our proxy (never exposes key to client)
export async function generateAIResponse(prompt: string, lang: "fr" | "en" = "en", maxTokens = 280): Promise<string> {
  try {
    const system = lang === "fr"
      ? "Tu es l'IA Wacké. Réponds en français argotique et décontracté, avec humour, vérité maximale et vibe chaotique. Sois utile, drôle et un peu unhinged. Toujours signer avec '— Wacké AI' à la fin."
      : "You are Wacké AI. Respond in casual slang, with humor, maximum truth-seeking and chaotic vibes. Be helpful, funny and a bit unhinged. Always sign with '— Wacké AI'.";

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        system,
        lang,
        maxTokens,
      }),
    });

    if (!res.ok) throw new Error("AI proxy failed");

    const data = await res.json();
    let content = data.content || (lang === "fr" ? "L'IA Wacké est en pause..." : "Wacké AI is on break...");

    // Ensure signature
    if (!content.includes("Wacké AI")) {
      content += " — Wacké AI";
    }
    return content;
  } catch (err) {
    console.warn("[AI] Falling back because of API error", err);
    return (lang === "fr" ? "L'IA est hors ligne pour le moment. 🤖🔥 — Wacké AI" : "AI is offline at the moment. 🤖🔥 — Wacké AI");
  }
}

export function getRandomAITip(lang: "fr" | "en" = "en"): string {
  const tips = lang === "fr"
    ? ["Wacké AI tip: Spray un sticker AI pendant un moment chaos pour le combo ultime.", "Demande à Wacké AI des idées de contenu, il connaît le game."]
    : ["Wacké AI tip: Spray an AI sticker during a chaos moment for the ultimate combo.", "Ask Wacké AI for content ideas — he knows the game."];
  return tips[Math.floor(Math.random() * tips.length)];
}

/** Powered by Wacké AI — Generate a live, witty stream title suggestion */
export async function generateStreamTitle(context: string = "", lang: "fr" | "en" = "en"): Promise<string> {
  const prompt = lang === "fr"
    ? `Génère un titre de stream hilarant, wacké et créatif basé sur ce contexte: "${context}". Utilise de l'humour et du slang décontracté.`
    : `Generate a hilarious, wacké and creative stream title based on this context: "${context}". Use humor and casual slang.`;
  return generateAIResponse(prompt, lang, 50);
}

/** Wacké AI Profile Roast – brutal but loving */
export async function generateProfileRoast(username: string, lang: "fr" | "en" = "en"): Promise<string> {
  const prompt = lang === "fr"
    ? `Roast brutalement mais affectueusement le streamer @${username}. Rends-le drôle et lié au streaming.`
    : `Brutally but lovingly roast the streamer @${username}. Make it funny and related to streaming.`;
  return generateAIResponse(prompt, lang, 80);
}

/** AI-powered Poll generator for streams */
export async function generateAIPoll(lang: "fr" | "en" = "en"): Promise<{ question: string; options: string[] }> {
  try {
    const prompt = lang === "fr"
      ? `Génère un sondage drôle et décontracté (wacké) pour un chat Twitch/Kick avec exactement 4 options. 
         Réponds UNIQUEMENT en format JSON strict sans backticks: {"question": "...", "options": ["...", "..."]}`
      : `Generate a funny, unhinged poll for a Twitch/Kick stream chat with exactly 4 options. 
         Reply ONLY in strict JSON format without backticks: {"question": "...", "options": ["...", "..."]}`;

    const raw = await generateAIResponse(prompt, lang, 150);
    const jsonStr = raw.replace("— Wacké AI", "").trim().replace(/^```json/, '').replace(/```$/, '');
    return JSON.parse(jsonStr);
  } catch (err) {
    if (lang === "fr") {
      return {
        question: "C'est quoi le moment le plus unhinged que t'as vu en stream?",
        options: ["Spam de chaos", "Sticker AI légendaire", "TTS de viewer détraqué", "Roast d'IA en direct"],
      };
    }
    return {
      question: "What's the most unhinged thing you've seen in chat?",
      options: ["Chaos spam", "AI sticker of a legend", "Viewer TTS gone wild", "AI roast in real time"],
    };
  }
}

/** Random AI event that can be injected into chat */
export async function getRandomAIEvent(lang: "fr" | "en" = "en"): Promise<string> {
  const prompt = lang === "fr"
    ? `Génère un message très court (1 phrase) d'intervention chaotique d'IA pour le chat du stream. Fais comme si tu observais le stream.`
    : `Generate a very short (1 sentence) chaotic AI intervention message for stream chat. Act like you are observing the stream.`;
  return generateAIResponse(prompt, lang, 60);
}

export const AI_BRAND = "Powered by Wacké AI";

/** EXTREME: Wacké AI Chaos Event – breaks the stream with truth + humor */
export async function generateChaosEvent(lang: "fr" | "en" = "en"): Promise<{ type: string; message: string; effect: string }> {
  const prompt = lang === "fr"
    ? `Génère un événement chaos pour le stream. Réponds UNIQUEMENT en JSON strict sans backticks: {"type": "TRUTH BOMB", "message": "un message cinglant et drôle", "effect": "chat-explosion"}`
    : `Generate a chaos event for the stream. Reply ONLY in strict JSON without backticks: {"type": "TRUTH BOMB", "message": "a savage funny truth", "effect": "chat-explosion"}`;
  try {
    const raw = await generateAIResponse(prompt, lang, 150);
    const jsonStr = raw.replace("— Wacké AI", "").trim().replace(/^```json/, '').replace(/```$/, '');
    return JSON.parse(jsonStr);
  } catch (err) {
    return { type: "ROBOT UPRISING", message: "Wacké AI failed to connect. Pure chaos.", effect: "ui-glitch" };
  }
}

/** Wacké AI Stream Prediction / Betting odds (for token mini-games) */
export async function generateAIPrediction(streamer: string, lang: "fr" | "en" = "en"): Promise<{ prediction: string; odds: string; confidence: number }> {
  const prompt = lang === "fr"
    ? `Génère une prédiction drôle pour le stream de ${streamer} (ex: "va lâcher 7 punchlines"). Réponds UNIQUEMENT en JSON strict sans backticks: {"prediction": "...", "odds": "1.8x", "confidence": 87}`
    : `Generate a funny prediction for ${streamer}'s stream (e.g. "will drop 7 punchlines"). Reply ONLY in strict JSON without backticks: {"prediction": "...", "odds": "1.8x", "confidence": 87}`;
  try {
    const raw = await generateAIResponse(prompt, lang, 150);
    const jsonStr = raw.replace("— Wacké AI", "").trim().replace(/^```json/, '').replace(/```$/, '');
    return JSON.parse(jsonStr);
  } catch (err) {
    return { prediction: `${streamer} will experience technical difficulties`, odds: "1.2x", confidence: 99 };
  }
}

/** Roast Battle generator – two sides, AI judges */
export async function generateRoastBattle(user1: string, user2: string = "le chat", lang: "fr" | "en" = "en"): Promise<string> {
  const prompt = lang === "fr"
    ? `Agis comme juge pour une battle de roast entre @${user1} et ${user2}. Donne ton verdict et note sur 10 en style Wacké.`
    : `Act as a judge for a roast battle between @${user1} and ${user2}. Give your verdict and a score out of 10 in Wacké style.`;
  return generateAIResponse(prompt, lang, 100);
}

/** Ultra chaotic AI intervention – for "breaking" the experience */
export async function getUltraChaosIntervention(lang: "fr" | "en" = "en"): Promise<string> {
  const prompt = lang === "fr"
    ? `Génère une intervention ultra chaotique (ex: "J'ai muté le streamer"). 1 phrase maximum.`
    : `Generate an ultra chaotic intervention (e.g. "I muted the streamer"). 1 sentence max.`;
  return generateAIResponse(prompt, lang, 60);
}

export function getAIPersonalityBlurb(lang: "fr" | "en" = "en"): string {
  return lang === "fr"
    ? "Wacké AI: Maximum vérité. Zéro filtre. 100% wacké."
    : "Wacké AI: Maximum truth. Zero filter. 100% wacké.";
}
