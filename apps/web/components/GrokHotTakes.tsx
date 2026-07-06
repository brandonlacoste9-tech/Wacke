"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { Sparkles, Volume2 } from "lucide-react";
import { speakWithGrokVoice, speakWithCloudGrokVoice } from "@/lib/audio";

export default function GrokHotTakes() {
  const { language, t } = useLanguage();
  const [takes, setTakes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHotTakes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: language === "fr" 
            ? "Génère 3 hot takes hilarants et un peu cruels sur le streaming québécois actuel, en argot dépanneur. Maximum vérité, maximum wacké."
            : "Generate 3 hilarious and slightly savage hot takes on current Quebec streaming, in depanneur slang. Maximum truth, maximum wacké.",
          maxTokens: 250,
        }),
      });
      const data = await res.json();
      if (data.content) {
        const lines = data.content.split('\n').filter((l: string) => l.trim());
        const newTakes = lines.slice(0, 3);
        setTakes(newTakes);
        // Speak the hot takes with real Grok xAI cloud voice
        if (newTakes.length > 0) {
          speakWithCloudGrokVoice(newTakes[0], language);
        }
      }
    } catch (e) {
      setTakes([t("grokErrorTakes")]);
    }
    setLoading(false);
  };

  const speakTake = (take: string) => {
    speakWithCloudGrokVoice(take, language);
  };

  return (
    <div className="glass-dark p-6 rounded-2xl border border-wacke-cyan/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-wacke-cyan" />
          <h3 className="font-bold graffiti-text neon-cyan">GROK'S HOT TAKES</h3>
        </div>
        <button
          onClick={fetchHotTakes}
          disabled={loading}
          className="text-xs bg-wacke-cyan text-black px-3 py-1 rounded font-bold hover:bg-white transition disabled:opacity-50"
        >
          {loading ? "GROK THINKING..." : "REFRESH TAKES"}
        </button>
      </div>
      {takes.length > 0 ? (
        <ul className="space-y-3 text-sm">
          {takes.map((take, i) => (
            <li key={i} className="border-l-2 border-wacke-cyan pl-3 text-gray-200 flex items-start gap-2">
              <span className="flex-1">{take}</span>
              <button 
                onClick={() => speakTake(take)} 
                className="shrink-0 p-1 text-wacke-cyan hover:bg-wacke-cyan/10 rounded"
                title="Speak with Grok Voice"
              >
                <Volume2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500">Hit refresh for fresh Grok xAI roasts on the scene.</p>
      )}
      <div className="mt-4 text-[10px] text-wacke-cyan/60">Powered by real Grok • Updated live</div>
    </div>
  );
}
