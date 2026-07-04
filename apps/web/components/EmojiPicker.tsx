"use client";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const WACKE_EMOJIS = [
  { emoji: "🔥", label: "Feu" },
  { emoji: "💀", label: "Skull" },
  { emoji: "💜", label: "Coeur violet" },
  { emoji: "⚡", label: "Éclair" },
  { emoji: "🏪", label: "Dépanneur" },
  { emoji: "❄️", label: "Frette" },
  { emoji: "🎨", label: "Art" },
  { emoji: "👑", label: "Couronne" },
  { emoji: "💣", label: "Bombe" },
  { emoji: "🐺", label: "Loup" },
  { emoji: "🚀", label: "Fusée" },
  { emoji: "😤", label: "Rage" },
  { emoji: "🦄", label: "Licorne" },
  { emoji: "🌈", label: "Arc-en-ciel" },
  { emoji: "👹", label: "Ogre" },
  { emoji: "💥", label: "Explosion" },
  { emoji: "🧨", label: "Pétard" },
  { emoji: "🎃", label: "Citrouille" },
  { emoji: "🦇", label: "Chauve-souris" },
  { emoji: "🍁", label: "Érable" },
  { emoji: "🥃", label: "Whisky" },
  { emoji: "🍺", label: "Bière" },
  { emoji: "🔫", label: "Pistolet" },
  { emoji: "💉", label: "Seringue" },
  // Kick love additions
  { emoji: "🟢", label: "Kick Green" },
  { emoji: "📺", label: "Kick Stream" },
  { emoji: "💚", label: "Kick Heart" },
  { emoji: "🚀", label: "Kick Launch" },
  { emoji: "🔥", label: "Kick Fire" },
  { emoji: "👀", label: "Live Eyes" },
  { emoji: "🎮", label: "Game On" },
];

const getTwemojiUrl = (emoji: string) => {
  const codePoints = Array.from(emoji)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-');
  return `https://twemoji.maxcdn.com/v/14.0.2/svg/${codePoints}.svg`;
};

/**
 * EmojiPicker — Quick emoji row for Graffiti Chat.
 * Uses Twemoji SVGs for crisp, consistent look across all devices.
 * Kick love included! 🟢
 * Still inserts the original emoji char for compatibility.
 */
export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1 px-1">
      {WACKE_EMOJIS.map((item) => (
        <button
          key={item.emoji}
          onClick={() => onSelect(item.emoji)}
          className="hover:scale-125 active:scale-95 transition-all hover:bg-white/10 hover:shadow-sm rounded-lg p-0.5 shrink-0"
          title={item.label}
          type="button"
        >
          <img
            src={getTwemojiUrl(item.emoji)}
            alt={item.emoji}
            className="emoji w-5 h-5"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </button>
      ))}
    </div>
  );
}
