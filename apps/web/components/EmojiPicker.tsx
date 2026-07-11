"use client";

import { useState } from "react";
import { EMOTES_BY_CATEGORY, type Emote, getTwemojiUrl } from "@/lib/emotes";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

// getTwemojiUrl imported from lib/emotes

// Exact AI Prompt Formula (from the Kick emote/badge spec)
function buildAIEmotePrompt(concept: string, isBadge = false) {
  const style = isBadge ? "Chat badge style" : "Twitch emote style";
  const base = concept.trim() || "A cartoon mascot of a raccoon wearing sunglasses and screaming with excitement";
  return `${base}, ${style}, flat vector illustration, thick outlines, solid white background, 1:1 aspect ratio.`;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [activeCat, setActiveCat] = useState<"global" | "channel" | "subscriber">("global");
  const [showPromptHelper, setShowPromptHelper] = useState(false);
  const [promptConcept, setPromptConcept] = useState("");
  const [promptIsBadge, setPromptIsBadge] = useState(false);

  const currentEmotes: Emote[] = EMOTES_BY_CATEGORY[activeCat] || [];

  const copyPrompt = () => {
    const p = buildAIEmotePrompt(promptConcept, promptIsBadge);
    navigator.clipboard?.writeText(p).catch(() => {});
    const orig = promptConcept;
    setPromptConcept("✅ Copied! Paste to AI → remove.bg → transparent 1:1 PNG");
    setTimeout(() => setPromptConcept(orig), 1700);
  };

  return (
    <div className="p-2">
      {/* Kick-like header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="text-[9px] font-bold text-wacke-cyan/70">KICK-STYLE EMOTES 🟢 (Global • Channel • Sub)</div>
        <button
          onClick={() => setShowPromptHelper((v) => !v)}
          className="text-[8px] px-1.5 py-0.5 rounded bg-wacke-purple/20 text-wacke-cyan hover:bg-wacke-purple/40"
          title="AI prompt formula for custom emotes & badges"
          type="button"
        >
          ✨ AI GENERATE
        </button>
      </div>

      {/* Category tabs - exactly like described */}
      <div className="flex gap-1 mb-1 text-[9px]">
        {(["global", "channel", "subscriber"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-2 py-0.5 rounded-full font-bold transition-all ${
              activeCat === cat ? "bg-wacke-cyan text-black" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
            type="button"
          >
            {cat === "global" && "🌍 GLOBAL"}
            {cat === "channel" && "🏪 CHANNEL"}
            {cat === "subscriber" && "💎 SUB"}
          </button>
        ))}
      </div>

      {/* Grid of emotes using Twemoji (crisp when small) */}
      <div className="grid grid-cols-6 gap-1 max-h-28 overflow-y-auto scrollbar-hide bg-wacke-darker/60 rounded-lg p-1">
        {currentEmotes.map((item) => (
          <button
            key={`${item.category}-${item.shortcode}`}
            onClick={() => onSelect(item.emoji)}
            className="hover:scale-125 active:scale-95 transition-all hover:bg-wacke-purple/20 hover:shadow-sm rounded-md p-1 flex items-center justify-center border border-transparent hover:border-wacke-purple/30"
            title={`:${item.shortcode}: — ${item.label}`}
            type="button"
          >
            <img
              src={item.imageUrl || getTwemojiUrl(item.emoji)}
              alt={item.label}
              className="emoji w-6 h-6 object-contain"
              style={{ imageRendering: "crisp-edges" }}
            />
          </button>
        ))}
        {currentEmotes.length === 0 && <div className="col-span-6 text-[10px] text-gray-500 p-2">No emotes in category.</div>}
      </div>

      <div className="text-[8px] text-gray-500 mt-1 px-1">Type :shortcode: in chat. Sub emotes usable globally.</div>

      {/* The crucial prompt formula + workflow section */}
      {showPromptHelper && (
        <div className="mt-2 p-2 bg-black/50 border border-wacke-cyan/30 rounded-lg text-[9px]">
          <div className="font-bold text-wacke-cyan mb-1">AI PROMPT FORMULA FOR EMOTES &amp; BADGES</div>
          <div className="text-[8px] text-gray-400 mb-1">
            Keywords (always use): "Twitch emote style" or "Chat badge style", "flat vector illustration", "thick outlines", "solid white background", "1:1 aspect ratio"
          </div>

          <div className="flex gap-1 mb-1">
            <input
              value={promptConcept}
              onChange={(e) => setPromptConcept(e.target.value)}
              placeholder="A cartoon coffee cup on fire"
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px]"
            />
            <button
              onClick={() => setPromptIsBadge(!promptIsBadge)}
              className={`px-2 py-1 rounded text-[9px] border ${promptIsBadge ? "bg-amber-500/20 border-amber-500" : "bg-white/5 border-white/20"}`}
              type="button"
            >
              {promptIsBadge ? "BADGE" : "EMOTE"}
            </button>
            <button onClick={copyPrompt} className="bg-wacke-cyan text-black font-bold px-2 rounded active:scale-95" type="button">
              COPY
            </button>
          </div>

          <div className="text-[8px] text-gray-500">
            1 subject + 1 emotion only. After image: Save → remove.bg → transparent PNG → upload. <br />
            Good: "A cartoon coffee cup on fire." Bad: complex scenes that become smudges when tiny.
          </div>
        </div>
      )}
    </div>
  );
}
