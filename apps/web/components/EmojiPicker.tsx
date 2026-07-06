"use client";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const WACKE_EMOJIS = [
  // Fire / Boom / Chaos set (the ones from Light the Match rain - now in chat!)
  { emoji: "🔥", label: "Feu / Fire" },
  { emoji: "💥", label: "Explosion" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "🧨", label: "Firecracker" },
  { emoji: "👹", label: "Ogre" },
  { emoji: "💣", label: "Bomb" },
  { emoji: "🌋", label: "Volcano" },
  { emoji: "💀", label: "Skull" },
  { emoji: "😈", label: "Devil" },
  { emoji: "👿", label: "Imp" },
  { emoji: "🌀", label: "Cyclone" },
  { emoji: "🌪️", label: "Tornado" },
  { emoji: "🦂", label: "Scorpion" },
  { emoji: "💯", label: "Hundred" },
  { emoji: "🤯", label: "Mind Blown" },
  // Original Wacké
  { emoji: "💜", label: "Coeur violet" },
  { emoji: "⚡", label: "Éclair" },
  { emoji: "🏪", label: "Dépanneur" },
  { emoji: "❄️", label: "Frette" },
  { emoji: "🎨", label: "Art" },
  { emoji: "👑", label: "Couronne" },
  { emoji: "🐺", label: "Loup" },
  { emoji: "😤", label: "Rage" },
  { emoji: "🦄", label: "Licorne" },
  { emoji: "🌈", label: "Arc-en-ciel" },
  { emoji: "🎃", label: "Citrouille" },
  { emoji: "🦇", label: "Chauve-souris" },
  { emoji: "🍁", label: "Érable" },
  { emoji: "🥃", label: "Whisky" },
  { emoji: "🍺", label: "Bière" },
  { emoji: "🔫", label: "Pistolet" },
  { emoji: "💉", label: "Seringue" },
  // Kick love
  { emoji: "🟢", label: "Kick Green" },
  { emoji: "📺", label: "Kick Stream" },
  { emoji: "💚", label: "Kick Heart" },
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
    <div className="p-2">
      <div className="text-[9px] font-bold text-wacke-cyan/70 mb-1 px-1">WACKÉ EMOTES (like Kick! 🟢)</div>
      <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto scrollbar-hide bg-wacke-darker/60 rounded-lg p-1">
        {WACKE_EMOJIS.map((item) => (
          <button
            key={item.emoji}
            onClick={() => onSelect(item.emoji)}
            className="hover:scale-125 active:scale-95 transition-all hover:bg-wacke-purple/20 hover:shadow-sm rounded-md p-1 flex items-center justify-center border border-transparent hover:border-wacke-purple/30"
            title={item.label}
            type="button"
          >
            <img
              src={getTwemojiUrl(item.emoji)}
              alt={item.emoji}
              className="emoji w-6 h-6"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
