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
];

/**
 * EmojiPicker — Quick emoji row for Graffiti Chat.
 * Wacké-branded emojis that insert directly into the chat input.
 */
export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1 px-1">
      {WACKE_EMOJIS.map((item) => (
        <button
          key={item.emoji}
          onClick={() => onSelect(item.emoji)}
          className="text-xl emoji hover:scale-125 active:scale-95 transition-all
                     hover:bg-white/10 hover:shadow-sm rounded-lg px-1.5 py-0.5 shrink-0"
          title={item.label}
          type="button"
        >
          {item.emoji}
        </button>
      ))}
    </div>
  );
}
