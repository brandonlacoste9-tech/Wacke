// Kick-style Emotes & Badges for Wacké chat
// Global (platform-wide), Channel (per-streamer), Subscriber (paying subs, global use)
// Follows the exact style guide for AI-generated custom ones: Twitch emote style + flat vector + thick outlines + solid white bg + 1:1

export type EmoteCategory = "global" | "channel" | "subscriber";

export interface Emote {
  shortcode: string;
  emoji: string;
  label: string;
  category: EmoteCategory;
  // Optional: for real custom uploaded emotes (after remove.bg). Falls back to emoji/Twemoji.
  imageUrl?: string;
}

// --- GLOBAL EMOTES (like Kick defaults - meme culture, everyone can use) ---
export const GLOBAL_EMOTES: Emote[] = [
  { shortcode: "pepe", emoji: "🐸", label: "Pepe", category: "global" },
  { shortcode: "kekw", emoji: "😂", label: "KEKW", category: "global" },
  { shortcode: "sadge", emoji: "😢", label: "Sadge", category: "global" },
  { shortcode: "pog", emoji: "😲", label: "POG", category: "global" },
  { shortcode: "monkas", emoji: "😰", label: "MonkaS", category: "global" },
  { shortcode: "lul", emoji: "🤣", label: "LUL", category: "global" },
  { shortcode: "fire", emoji: "🔥", label: "Fire", category: "global" },
  { shortcode: "boom", emoji: "💥", label: "BOOM", category: "global" },
  { shortcode: "rocket", emoji: "🚀", label: "Rocket", category: "global" },
  { shortcode: "skull", emoji: "💀", label: "Skull", category: "global" },
  { shortcode: "devil", emoji: "😈", label: "Devil", category: "global" },
  { shortcode: "mindblown", emoji: "🤯", label: "Mind Blown", category: "global" },
  { shortcode: "hundred", emoji: "💯", label: "100", category: "global" },
  { shortcode: "eyes", emoji: "👀", label: "Eyes", category: "global" },
];

// --- CHANNEL EMOTES (streamer uploads up to 60 - only work in their channel) ---
export const CHANNEL_EMOTES: Emote[] = [
  { shortcode: "wacke", emoji: "🏪", label: "Wacké", category: "channel" },
  { shortcode: "dep", emoji: "🏪", label: "Dépanneur", category: "channel" },
  { shortcode: "frette", emoji: "❄️", label: "Frette", category: "channel" },
  { shortcode: "art", emoji: "🎨", label: "Art", category: "channel" },
  { shortcode: "wolf", emoji: "🐺", label: "Loup", category: "channel" },
  { shortcode: "crown", emoji: "👑", label: "Crown", category: "channel" },
  { shortcode: "maple", emoji: "🍁", label: "Maple", category: "channel" },
  { shortcode: "beer", emoji: "🍺", label: "Bière", category: "channel" },
  { shortcode: "whisky", emoji: "🥃", label: "Whisky", category: "channel" },
  { shortcode: "rage", emoji: "😤", label: "Rage", category: "channel" },
  { shortcode: "unicorn", emoji: "🦄", label: "Licorne", category: "channel" },
  { shortcode: "pumpkin", emoji: "🎃", label: "Citrouille", category: "channel" },
  // Demo customs generated with the EXACT Grok formula in the spec (replace jpgs with your remove.bg transparent PNGs)
  { shortcode: "raccoon", emoji: "🦝", label: "Raccoon Hype (custom)", category: "channel", imageUrl: "/emotes/raccoon-hype.jpg" },
  { shortcode: "gcoin", emoji: "🪙", label: "Gold Skull (custom)", category: "channel", imageUrl: "/emotes/gold-skull.jpg" },
];

// --- SUBSCRIBER EMOTES (Affiliate perk, up to 24 - subs can use in ANY channel) ---
export const SUBSCRIBER_EMOTES: Emote[] = [
  { shortcode: "gold", emoji: "🪙", label: "Gold Coin", category: "subscriber" },
  { shortcode: "goldsad", emoji: "😭", label: "Gold Sad", category: "subscriber" },
  { shortcode: "diamond", emoji: "💎", label: "Diamond", category: "subscriber" },
  { shortcode: "firecrown", emoji: "👑", label: "Fire Crown", category: "subscriber" },
  { shortcode: "blaze", emoji: "🌋", label: "Blaze", category: "subscriber" },
  { shortcode: "champ", emoji: "🏆", label: "Champion", category: "subscriber" },
];

export const ALL_EMOTES = [...GLOBAL_EMOTES, ...CHANNEL_EMOTES, ...SUBSCRIBER_EMOTES];

// Shortcode -> emoji map (Kick style :shortcode: replacement)
export const EMOTE_MAP: Record<string, string> = Object.fromEntries(
  ALL_EMOTES.map((e) => [e.shortcode.toLowerCase(), e.emoji])
);

// For custom image emotes: shortcode -> public path (use after background removal!)
export const EMOTE_IMAGES: Record<string, string> = Object.fromEntries(
  ALL_EMOTES.filter((e) => e.imageUrl).map((e) => [e.shortcode.toLowerCase(), e.imageUrl!])
);

// Grouped for the picker UI
export const EMOTES_BY_CATEGORY: Record<EmoteCategory, Emote[]> = {
  global: GLOBAL_EMOTES,
  channel: CHANNEL_EMOTES,
  subscriber: SUBSCRIBER_EMOTES,
};

// --- BADGES (lil pics next to names) ---
// Matches the exact breakdown: Broadcaster, Mod, VIP/OG, Verified, Subscriber (evolving tiers)

export type BadgeType =
  | "broadcaster"
  | "moderator"
  | "vip"
  | "og"
  | "verified"
  | "subscriber";

export interface ChatBadge {
  type: BadgeType;
  tier?: 1 | 3 | 6 | 12; // months for subs (evolves!)
  label?: string;
}

export function getBadgeEmoji(badge: ChatBadge): string {
  switch (badge.type) {
    case "broadcaster":
      return "📺"; // camera / play style
    case "moderator":
      return "🛡️"; // sword / shield
    case "vip":
      return "⭐";
    case "og":
      return "🦴"; // oldest loyal
    case "verified":
      return "✅";
    case "subscriber":
      if (badge.tier && badge.tier >= 12) return "🏆";
      if (badge.tier && badge.tier >= 6) return "🥇";
      if (badge.tier && badge.tier >= 3) return "🥈";
      return "🥉"; // 1 month base
    default:
      return "•";
  }
}

export function getBadgeLabel(badge: ChatBadge): string {
  const base =
    badge.type === "broadcaster"
      ? "Broadcaster"
      : badge.type === "moderator"
      ? "Mod"
      : badge.type === "vip"
      ? "VIP"
      : badge.type === "og"
      ? "OG"
      : badge.type === "verified"
      ? "Verified"
      : "Sub";

  if (badge.type === "subscriber" && badge.tier) {
    return `${base} ${badge.tier}mo`;
  }
  return badge.label || base;
}

// Helper: parse Kick badge data into our ChatBadge[]
export function parseKickBadges(rawBadges: any[] | undefined): ChatBadge[] {
  if (!rawBadges || rawBadges.length === 0) return [];
  const result: ChatBadge[] = [];

  for (const b of rawBadges) {
    const t = (b?.type || "").toLowerCase();
    if (t.includes("broadcaster")) {
      result.push({ type: "broadcaster" });
    } else if (t.includes("moderator")) {
      result.push({ type: "moderator" });
    } else if (t.includes("vip")) {
      result.push({ type: "vip" });
    } else if (t.includes("og")) {
      result.push({ type: "og" });
    } else if (t.includes("verified")) {
      result.push({ type: "verified" });
    } else if (t.includes("subscriber")) {
      // Try to extract months e.g. "3-month-subscriber" or text: "3"
      let months = 1;
      const txt = (b?.text || "").toLowerCase();
      const m = txt.match(/(\d+)/);
      if (m) months = Math.min(12, parseInt(m[1], 10) || 1);
      // map to closest tier
      const tier = months >= 12 ? 12 : months >= 6 ? 6 : months >= 3 ? 3 : 1;
      result.push({ type: "subscriber", tier: tier as any });
    }
  }
  return result;
}

// For demo Wacké users (fake some variety)
export const getTwemojiUrl = (emoji: string) =>
  `https://twemoji.maxcdn.com/v/14.0.2/svg/${Array.from(emoji)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-")}.svg`;

export function getDemoBadgesForUser(username: string, isBroadcaster?: boolean): ChatBadge[] {
  const lower = (username || "").toLowerCase();
  const badges: ChatBadge[] = [];

  if (isBroadcaster || lower.includes("stream") || lower.includes("wacke")) {
    badges.push({ type: "broadcaster" });
  }
  if (lower.includes("mod") || lower.includes("admin")) {
    badges.push({ type: "moderator" });
  }
  if (lower.includes("vip")) {
    badges.push({ type: "vip" });
  }
  if (lower.includes("og") || lower.includes("old")) {
    badges.push({ type: "og" });
  }
  if (lower.includes("verified") || lower.includes("kick")) {
    badges.push({ type: "verified" });
  }
  // Random sub for demo flavor
  if (Math.random() < 0.25) {
    const tiers: (1 | 3 | 6 | 12)[] = [1, 3, 6, 12];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    badges.push({ type: "subscriber", tier });
  }
  return badges;
}
