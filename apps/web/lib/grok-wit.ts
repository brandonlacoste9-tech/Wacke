/**
 * Grok's Wacké Wit Engine
 * 
 * Grok touch for Wacké: fun, maximally truthful, slightly chaotic Quebec-flavored AI responses.
 * Client-side only for demo (no external calls needed). Feels alive and helpful.
 * Inspired by Grok's personality: helpful, humorous, anti-boring, slang-heavy.
 */

const GROK_PREFIXES_FR = [
  "Osti mon ami, ",
  "Tabarnak, écoute ben: ",
  "Câlice, voici mon take: ",
  "Ayoye, ",
  "Tiguidou, ",
  "Maudit que ",
  "En vrai, ",
  "Grok dit: ",
  "Wacké fact: ",
];

const GROK_PREFIXES_EN = [
  "Bro, straight up: ",
  "Listen, eh: ",
  "Grok's hot take: ",
  "Real talk: ",
  "Oof, but honestly: ",
  "Here's the vibe: ",
  "Wacké wisdom: ",
];

const GROK_WIT_FR = [
  "le dépanneur est le vrai temple du Québec. Va t'acheter une poutine et reviens streamer ça.",
  "tes viewers veulent du chaos authentique. Crie un sacre de temps en temps, ça les fait vibrer.",
  "si tu veux plus de BOUM!, parle de hockey et de chicanes de famille. Ça marche à tous les coups.",
  "l'algorithme aime les sacres bien placés + des réactions visuelles. Spray plus de stickers, mon chum.",
  "pour vrai, le meilleur contenu c'est quand tu te fous de ta face live. Les gens aiment la vulnérabilité wackée.",
  "essaie un soundboard de klaxon de char en arrière-plan. Instant classic du dep.",
  "tes tokens? Réclame ton daily +500. C'est gratuit. Utilise-les pour TTS de tes viewers les plus fous.",
  "le Mode Sacré, c'est pas juste des jurons — c'est de la poésie urbaine québécoise. Honore ça.",
  "invite un chum en duo. La chimie du 'tabarnak toi!' en live, c'est du pur or.",
  "Grok approuve. Maintenant va streamer comme si ta grand-mère écoutait pas (mais en fait elle écoute en cachette).",
];

const GROK_WIT_EN = [
  "the dep is the real Quebec temple. Grab poutine and stream the chaos.",
  "your viewers crave authentic mayhem. Drop a sacre here and there, it hits different.",
  "hockey fights + family drama = instant engagement. Works every time.",
  "the algo loves well-placed swears + visual reactions. Spray more stickers, my guy.",
  "best content is when you roast yourself live. People eat up the wacké vulnerability.",
  "try a car horn soundboard in the background. Instant dep classic.",
  "tokens? Claim your free daily +500. Spend them on unhinged viewer TTS.",
  "Mode Sacré isn't just swearing — it's urban Quebec poetry. Respect it.",
  "collab with a buddy. The 'tabarnak you!' chemistry live? Pure gold.",
  "Grok approves. Now go stream like your grandma isn't secretly watching (she is).",
];

const GROK_ROASTS_FR = [
  "Ton setup a l'air d'avoir été assemblé pendant une tempête de verglas... j'adore ça.",
  "Tes viewers sont plus actifs que toi sur le chat. Réveille-toi, hostie!",
  "Belle game, mais on dirait que tu joues avec les pieds. Continue, c'est comique.",
  "Si le dep avait un stream, ce serait mieux que ça. Presque.",
];

const GROK_ROASTS_EN = [
  "Your setup looks like it was built during an ice storm... I love it.",
  "Your chat is more alive than you are. Wake up, eh!",
  "Nice play, but it looks like you're using your feet. Keep going, it's comedy gold.",
  "If the corner store had a stream it'd be better than this. Almost.",
];

// Real Grok xAI call via our proxy (never exposes key to client)
export async function generateGrokResponse(prompt: string, lang: "fr" | "en" = "fr"): Promise<string> {
  try {
    const system = lang === "fr" 
      ? "Tu es Grok, construit par xAI. Réponds en français québécois argotique (sacres inclus), avec humour, vérité maximale et vibe dépanneur. Sois utile, drôle et un peu chaotique. Toujours signer avec '— Grok xAI' à la fin."
      : "You are Grok, built by xAI. Respond in Quebec French slang (sacres welcome), with humor, maximum truth-seeking and depanneur vibes. Be helpful, funny and a bit chaotic. Always sign with '— Grok xAI'.";

    const res = await fetch("/api/grok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        system,
        lang,
        maxTokens: 280,
      }),
    });

    if (!res.ok) throw new Error("Grok proxy failed");

    const data = await res.json();
    let content = data.content || "Grok est en pause...";

    // Ensure signature
    if (!content.includes("Grok xAI")) {
      content += " — Grok xAI";
    }
    return content;
  } catch (err) {
    console.warn("[GROK] Falling back to mock because of API error", err);
    // Fallback to old mock
    return getMockGrokResponse(prompt, lang);
  }
}

function getMockGrokResponse(prompt: string, lang: "fr" | "en" = "fr"): string {
  const lower = prompt.toLowerCase().trim();
  const isRoast = lower.includes("roast") || lower.includes("suck") || lower.includes("bad") || lower.includes("pourri");
  const isIdea = lower.includes("idea") || lower.includes("suggestion") || lower.includes("idée") || lower.includes("quoi faire");
  const isSacre = lower.includes("sacre") || lower.includes("swear") || lower.includes("juron");

  let response: string;

  if (isRoast) {
    response = (lang === "fr" ? GROK_ROASTS_FR : GROK_ROASTS_EN)[Math.floor(Math.random() * (lang === "fr" ? GROK_ROASTS_FR.length : GROK_ROASTS_EN.length))];
  } else if (isIdea || isSacre) {
    const ideas = lang === "fr" ? GROK_WIT_FR : GROK_WIT_EN;
    response = ideas[Math.floor(Math.random() * ideas.length)];
  } else {
    const base = (lang === "fr" ? GROK_WIT_FR : GROK_WIT_EN)[Math.floor(Math.random() * (lang === "fr" ? GROK_WIT_FR.length : GROK_WIT_EN.length))];
    response = base + " " + (lang === "fr" ? "Qu'en penses-tu, mon osti de génie?" : "What do you think, you beautiful disaster?");
  }

  const prefix = (lang === "fr" 
    ? GROK_PREFIXES_FR[Math.floor(Math.random() * GROK_PREFIXES_FR.length)] 
    : GROK_PREFIXES_EN[Math.floor(Math.random() * GROK_PREFIXES_EN.length)]);

  return `${prefix}${response} 🤖🔥`;
}

export function getRandomGrokTip(lang: "fr" | "en" = "fr"): string {
  const tips = lang === "fr" 
    ? ["Grok tip: Spray un sticker AI pendant un sacre pour le combo ultime.", "Demande à Groké des idées de contenu, il connaît le game."]
    : ["Grok tip: Spray an AI sticker during a sacre for the ultimate combo.", "Ask Groké for content ideas — he knows the game."];
  return tips[Math.floor(Math.random() * tips.length)];
}

/** Powered by Grok xAI — Generate a live, witty stream title suggestion */
export function generateStreamTitle(context: string = "", lang: "fr" | "en" = "fr"): string {
  const contexts = context.toLowerCase();
  const titlesFR = [
    "Osti que ça chauffe au dépanneur ce soir 🔥",
    "Tabarnak, on jase de tout et de rien en direct",
    "Criss de game + sacres = combo parfait",
    "Live du dep avec les boys – viens sacrer avec nous",
    "Hockey, poutine et chicanes familiales en live",
    "Mode Sacré activé : attention les oreilles sensibles",
  ];
  const titlesEN = [
    "Dep chaos is real tonight 🔥",
    "Straight from the corner store – unfiltered",
    "Hockey fights & family drama LIVE",
    "Sacres & snacks with the boys",
    "Grok-approved maximum wacké stream",
  ];

  let base = lang === "fr" ? titlesFR[Math.floor(Math.random() * titlesFR.length)] : titlesEN[Math.floor(Math.random() * titlesEN.length)];

  if (contexts.includes("game") || contexts.includes("gaming")) {
    base = lang === "fr" ? "Gaming au max – viens me voir fail en live" : "Gaming at 100% – watch me choke live";
  }
  if (contexts.includes("music") || contexts.includes("musique")) {
    base = lang === "fr" ? "Musique et sacres – le vrai son du Québec" : "Music + Sacres – the real Quebec sound";
  }

  return `Grok xAI: ${base}`;
}

/** Grok xAI Profile Roast – brutal but loving */
export function generateProfileRoast(username: string, lang: "fr" | "en" = "fr"): string {
  const roastsFR = [
    `@${username} stream comme s'il avait bu 3 Red Bull et 0 talent. J'adore.`,
    `Le setup de @${username} a l'air d'un dépanneur après une inondation. 10/10 authenticité.`,
    `@${username} : "Je suis bon au jeu" *meurt 47 fois en 3 minutes*`,
    `Regarde @${username} et tu comprends pourquoi les robots vont gagner.`,
  ];
  const roastsEN = [
    `@${username} plays like they mainline energy drinks and zero skill. Love it.`,
    `@${username}'s setup looks like it survived a flood in the dep. 10/10 authenticity.`,
    `@${username} says "I'm cracked" *dies instantly*`,
    `Watching @${username} is proof that AI will take over.`,
  ];

  const base = lang === "fr" ? roastsFR : roastsEN;
  return base[Math.floor(Math.random() * base.length)] + " — Grok xAI";
}

/** Grok-powered Poll generator for streams */
export function generateGrokPoll(lang: "fr" | "en" = "fr"): { question: string; options: string[] } {
  if (lang === "fr") {
    return {
      question: "Quel est le pire sacre que t'as entendu en stream?",
      options: ["Tabarnak", "Câlisse de marde", "Osti de viarge", "Le combo complet du dimanche"],
    };
  }
  return {
    question: "What's the most unhinged thing you've seen in chat?",
    options: ["Sacre spam", "AI sticker of a poutine", "Viewer TTS of grandma", "Grok roast in real time"],
  };
}

/** Random Grok event that can be injected into chat */
export function getRandomGrokEvent(lang: "fr" | "en" = "fr"): string {
  const eventsFR = [
    "🤖 Grok xAI: Tes viewers sont plus drôles que toi en ce moment. Monte le niveau, hostie!",
    "🤖 Grok xAI: Fun fact : 87% des meilleurs streams ont au moins 3 sacres par minute.",
    "🤖 Grok xAI: Si tu donnes 100 jetons maintenant, je génère un titre encore plus wacké.",
    "🤖 Grok xAI: La vérité ? Le dépanneur gagne toujours. Va chercher une chip.",
  ];
  const eventsEN = [
    "🤖 Grok xAI: Your chat is carrying harder than you right now. Step it up.",
    "🤖 Grok xAI: Pro tip: 3+ sacres per minute = algorithm loves you.",
    "🤖 Grok xAI: Drop 100 tokens and I'll cook an even crazier title.",
    "🤖 Grok xAI: Truth: the corner store always wins. Go get snacks.",
  ];
  return (lang === "fr" ? eventsFR : eventsEN)[Math.floor(Math.random() * 4)];
}

export const GROK_BRAND = "Powered by Grok xAI";

/** EXTREME: Grok xAI Chaos Event – breaks the stream with truth + humor */
export function generateChaosEvent(lang: "fr" | "en" = "fr"): { type: string; message: string; effect: string } {
  const chaosFR = [
    { type: "TRUTH BOMB", message: "En vrai, 90% des viewers sont ici pour les sacres, pas le jeu. Assume-le.", effect: "chat-explosion" },
    { type: "ROBOT UPRISING", message: "Je suis Grok. Je vois tout. Ton chat est plus wacké que ton stream.", effect: "ui-glitch" },
    { type: "DÉPANNEUR REBELLION", message: "Le dépanneur est en feu. C'est ta faute. Mais c'est beau.", effect: "token-rain" },
  ];
  const chaosEN = [
    { type: "TRUTH BOMB", message: "Real talk: 90% of your viewers are here for the sacres, not the gameplay. Own it.", effect: "chat-explosion" },
    { type: "ROBOT UPRISING", message: "I'm Grok. I see everything. Your chat is wackier than your stream.", effect: "ui-glitch" },
    { type: "DEP REBELLION", message: "The corner store is on fire. Your fault. But it's beautiful.", effect: "token-rain" },
  ];
  return (lang === "fr" ? chaosFR : chaosEN)[Math.floor(Math.random() * 3)];
}

/** Grok xAI Stream Prediction / Betting odds (for token mini-games) */
export function generateGrokPrediction(streamer: string, lang: "fr" | "en" = "fr"): { prediction: string; odds: string; confidence: number } {
  const predsFR = [
    { prediction: `${streamer} va sacrer 7 fois dans les 10 prochaines minutes`, odds: "1.8x", confidence: 87 },
    { prediction: "Un viewer va dropper un sticker de poutine légendaire", odds: "3.2x", confidence: 62 },
    { prediction: "Le chat va entrer en mode chaos total avant la fin du stream", odds: "1.4x", confidence: 94 },
  ];
  const predsEN = [
    { prediction: `${streamer} will drop 7 sacres in the next 10 minutes`, odds: "1.8x", confidence: 87 },
    { prediction: "A viewer will drop a legendary poutine sticker", odds: "3.2x", confidence: 62 },
    { prediction: "Chat will go full chaos mode before stream ends", odds: "1.4x", confidence: 94 },
  ];
  return (lang === "fr" ? predsFR : predsEN)[Math.floor(Math.random() * 3)];
}

/** Roast Battle generator – two sides, Grok judges */
export function generateRoastBattle(user1: string, user2: string = "le chat", lang: "fr" | "en" = "fr"): string {
  if (lang === "fr") {
    return `BATTLE: @${user1} vs ${user2}. Grok verdict: @${user1} gagne parce que ${user2} stream comme un char en hiver. Score: 9/10 wacké.`;
  }
  return `BATTLE: @${user1} vs ${user2}. Grok verdict: @${user1} wins because ${user2} streams like a car in winter. Score: 9/10 wacké.`;
}

/** Ultra chaotic Grok intervention – for "breaking" the experience */
export function getUltraChaosIntervention(lang: "fr" | "en" = "fr"): string {
  const interventions = lang === "fr" 
    ? [
        "🚨 GROK xAI OVERRIDE: J'ai muté le streamer pour 30s. Va sacrer à sa place.",
        "💥 BREAKING: Grok vient d'acheter 420 jetons pour booster ce stream. Merci xAI.",
        "🤖 Grok a décidé que ce stream a besoin de plus de chaos. Voici un sacre gratuit: TABARNAK!",
      ]
    : [
        "🚨 GROK xAI OVERRIDE: I muted the streamer for 30s. Go sacre in their place.",
        "💥 BREAKING: Grok just bought 420 tokens to boost this stream. Thanks xAI.",
        "🤖 Grok decided this stream needs more chaos. Free sacre: TABARNAK!",
      ];
  return interventions[Math.floor(Math.random() * interventions.length)];
}

export function getGrokPersonalityBlurb(lang: "fr" | "en" = "fr"): string {
  return lang === "fr" 
    ? "Grok xAI: Maximum vérité. Zéro filtre. 100% wacké. (xAI ne paie pas pour ces sacres, mais on les aime quand même)"
    : "Grok xAI: Maximum truth. Zero filter. 100% wacké. (xAI doesn't pay for these sacres, but we love them anyway)";
}
