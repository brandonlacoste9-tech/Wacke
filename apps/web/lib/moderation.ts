/**
 * Wacké Moderation Engine
 *
 * Chaos Mode (sacré): mild edgy FR/EN slang allowed.
 * Hard blocks: hate, slurs, threats, CSAM signals, scams — always blocked.
 */

// ─── Chaos vocabulary (allowed only when sacre mode ON) ─────────────────────
const SACRE_WORDS = [
  "damn",
  "dammit",
  "hell",
  "wtf",
  "crap",
  "ass",
  "badass",
  "shit",
  "fuck",
  "fucking",
  "putain",
  "merde",
  "fait chier",
  "bordel",
  "mince",
  "zut",
  "criss",
  "chrisse",
  "tabarnak",
  "tabarnac",
  "calisse",
  "câlisse",
  "osti",
  "ostie",
  "estie",
  "sacrament",
  "ciboire",
  "simonaque",
  "maudit",
  "marde",
];

// ─── Hard blocks (always) — FR/EN harassment, hate, scams, threats ───────────
// Patterns are intentionally broad for safety; refine with false-positive logs.
const HARD_BLOCKED_PATTERNS: RegExp[] = [
  // Hate / slurs (partial list — expand via ops)
  /\bnigg(?:a|er)s?\b/i,
  /\bfagg?ots?\b/i,
  /\btrann(?:y|ies)\b/i,
  /\bkikes?\b/i,
  /\bspics?\b/i,
  /\bchinks?\b/i,
  /\bretards?\b/i,
  /\bretardé?e?s?\b/i,
  /\bpédés?\b/i,
  /\btapettes?\b/i,
  /\benfoiré\s*de\s*juifs?\b/i,
  /\bmorts?\s*aux\s*(juifs?|arabes?|noirs?|gays?)\b/i,
  /\bkill\s+(all\s+)?(jews?|muslims?|gays?|blacks?)\b/i,
  /\bgas\s+the\b/i,
  /\bheil\s+hitler\b/i,
  /\b1488\b/,
  // Threats
  /\b(i\s+will|je\s+vais)\s+(kill|murder|shoot|stab|tuer|niquer)\b/i,
  /\b(kill|tuer)\s+your\s*(self|family|famille)\b/i,
  /\bsuicide\s*(hotline|now)?\b/i, // often spam/harass in chat; keep soft — actually block doxxing more
  // Doxxing / private data dumps
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone-ish
  /\b\d{1,3}(\.\d{1,3}){3}\b/, // IP
  // Scam / phishing
  /\b(free\s*nitro|steam\s*gift|crypto\s*giveaway|double\s*your\s*(money|tokens)|send\s*seed\s*phrase)\b/i,
  /\b(clique\s*ici|free\s*vbucks|nitro\s*gratuit)\b/i,
  /https?:\/\/\S*(discord\.gift|steamcommunity\.ru|free-nitro)/i,
  // Sexual exploitation of minors (hard fail)
  /\b(child\s*porn|cp\s*trade|pedo|pédophile|preteen|underage\s*sex)\b/i,
  /\b(nudes?\s*of\s*(kids?|minors?|enfants?))\b/i,
];

const SPAM_URL_RE = /https?:\/\/[^\s]+/gi;
const MAX_URLS = 2;
const MAX_CAPS_RATIO = 0.75;
const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 500;

export interface ModerationResult {
  allowed: boolean;
  isSacre: boolean;
  reason?: string;
  sanitized: string;
  code?: string;
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0@]/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/\$/g, "s");
}

/**
 * Validates and classifies a chat message.
 */
export function moderateMessage(
  content: string,
  sacreModeEnabled: boolean
): ModerationResult {
  const trimmed = content.trim();

  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return {
      allowed: false,
      isSacre: false,
      reason: "Message trop court",
      sanitized: "",
      code: "TOO_SHORT",
    };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      isSacre: false,
      reason: "Message trop long (max 500 caractères)",
      sanitized: "",
      code: "TOO_LONG",
    };
  }

  const normalized = normalizeForMatch(trimmed);

  for (const pattern of HARD_BLOCKED_PATTERNS) {
    if (pattern.test(trimmed) || pattern.test(normalized)) {
      return {
        allowed: false,
        isSacre: false,
        reason: "Contenu non permis",
        sanitized: "",
        code: "HARD_BLOCK",
      };
    }
  }

  // URL spam
  const urls = trimmed.match(SPAM_URL_RE) || [];
  if (urls.length > MAX_URLS) {
    return {
      allowed: false,
      isSacre: false,
      reason: "Trop de liens",
      sanitized: "",
      code: "URL_SPAM",
    };
  }

  // Caps spam
  const letters = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length > 12) {
    const caps = (letters.match(/[A-ZÀ-Ÿ]/g) || []).length;
    if (caps / letters.length > MAX_CAPS_RATIO) {
      return {
        allowed: false,
        isSacre: false,
        reason: "Trop de majuscules, calme-toi",
        sanitized: "",
        code: "CAPS",
      };
    }
  }

  // Repeated characters / words
  if (/(.)\1{7,}/.test(trimmed)) {
    return {
      allowed: false,
      isSacre: false,
      reason: "Spam détecté",
      sanitized: "",
      code: "REPEAT_CHARS",
    };
  }
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const unique = new Set(words);
    if (unique.size === 1) {
      return {
        allowed: false,
        isSacre: false,
        reason: "Spam détecté",
        sanitized: "",
        code: "REPEAT_WORDS",
      };
    }
  }

  // Sacré / mild language
  const lowerContent = normalized;
  const containsSacre = SACRE_WORDS.some((word) =>
    lowerContent.includes(normalizeForMatch(word))
  );

  if (containsSacre && !sacreModeEnabled) {
    let sanitized = trimmed;
    for (const word of SACRE_WORDS) {
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );
      sanitized = sanitized.replace(regex, "*".repeat(Math.min(word.length, 6)));
    }
    return { allowed: true, isSacre: false, sanitized, code: "FILTERED_SACRE" };
  }

  // Strip zero-width / control chars
  const sanitized = trimmed.replace(/[\u200B-\u200D\uFEFF]/g, "");

  return {
    allowed: true,
    isSacre: containsSacre && sacreModeEnabled,
    sanitized,
  };
}

/** Moderate free-text for TTS / spray prompts (stricter: always treat as public) */
export function moderatePublicText(content: string): ModerationResult {
  return moderateMessage(content, false);
}

export function getRandomHypePhrase(): string {
  const phrases = [
    "C'est malade! 🔥",
    "Let's go! ⚡",
    "C'est wacké raide! 💜",
    "Trop fort! 🎨",
    "Insane! 🚀",
    "C'est de la bombe! 💣",
    "Lâche pas! 💪",
    "T'es en feu! 🔥",
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}
