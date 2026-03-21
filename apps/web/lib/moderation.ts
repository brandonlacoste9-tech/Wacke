/**
 * Wacké Moderation Engine
 *
 * Mode Sacré: When enabled, Québécois sacres (religious swear words) are
 * ALLOWED and celebrated as authentic cultural expression. When disabled,
 * standard content filtering applies.
 *
 * This module handles message validation, spam detection, and content
 * classification for the Graffiti Chat system.
 */

// ─── Sacré Vocabulary ─────────────────────────────────────────────────────────
// These are authentic Québécois sacres — treated as cultural expression,
// not hate speech. They are PERMITTED in Mode Sacré.
const SACRE_WORDS = [
  "ostie", "osti", "câlice", "calice", "tabarnak", "tabarnac",
  "crisse", "crise", "viarge", "maudit", "baptême", "batince",
  "estie", "esti", "sacrament", "ciboire", "câline",
];

// ─── Hard Block List ──────────────────────────────────────────────────────────
// Actual hate speech, slurs, and harassment — blocked regardless of mode.
const HARD_BLOCKED_PATTERNS = [
  /\b(hate|slur|harassment)\b/i, // Placeholder — extend with actual patterns
];

// ─── Spam Detection ───────────────────────────────────────────────────────────
const MAX_CAPS_RATIO = 0.7;   // >70% caps = spam
const MAX_REPEAT_CHARS = 6;   // "AAAAAAA" = spam
const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGE_LENGTH = 500;

export interface ModerationResult {
  allowed: boolean;
  isSacre: boolean;
  reason?: string;
  sanitized: string;
}

/**
 * Validates and classifies a chat message.
 * @param content - Raw message content from the user
 * @param sacreModeEnabled - Whether Mode Sacré is active for this stream
 */
export function moderateMessage(
  content: string,
  sacreModeEnabled: boolean
): ModerationResult {
  const trimmed = content.trim();

  // Length validation
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return { allowed: false, isSacre: false, reason: "Message trop court", sanitized: "" };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      isSacre: false,
      reason: "Message trop long (max 500 caractères)",
      sanitized: "",
    };
  }

  // Hard block check — always enforced regardless of mode
  for (const pattern of HARD_BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, isSacre: false, reason: "Contenu non permis", sanitized: "" };
    }
  }

  // Spam detection
  const capsRatio = (trimmed.match(/[A-Z]/g) || []).length / trimmed.length;
  if (capsRatio > MAX_CAPS_RATIO && trimmed.length > 10) {
    return { allowed: false, isSacre: false, reason: "Trop de majuscules, calme-toi", sanitized: "" };
  }

  if (/(.)\1{6,}/.test(trimmed)) {
    return { allowed: false, isSacre: false, reason: "Spam détecté", sanitized: "" };
  }

  // Sacré detection
  const lowerContent = trimmed.toLowerCase();
  const containsSacre = SACRE_WORDS.some((word) => lowerContent.includes(word));

  // If sacre is detected and mode is OFF, replace with asterisks
  if (containsSacre && !sacreModeEnabled) {
    let sanitized = trimmed;
    for (const word of SACRE_WORDS) {
      const regex = new RegExp(word, "gi");
      sanitized = sanitized.replace(regex, "*".repeat(word.length));
    }
    return { allowed: true, isSacre: false, sanitized };
  }

  return {
    allowed: true,
    isSacre: containsSacre && sacreModeEnabled,
    sanitized: trimmed,
  };
}

/**
 * Returns a random Québécois hype phrase for the chat UI.
 * Used when a user sends a Boum! reaction.
 */
export function getRandomHypePhrase(): string {
  const phrases = [
    "Ayoye c'est malade! 🔥",
    "Tiguidou! ⚡",
    "C'est wacké raide! 💜",
    "Osti que c'est bon! 🎨",
    "Câlice, trop fort! 🚀",
    "C'est de la bombe! 💣",
    "Lâche pas! 💪",
    "T'es en feu mon chum! 🔥",
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}
