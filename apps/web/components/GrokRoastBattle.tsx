"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { Flame, Sword, Volume2 } from "lucide-react";
import { speakWithGrokVoice, speakWithCloudGrokVoice } from "@/lib/audio";

interface GrokRoastBattleProps {
  streamerName: string;
}

export default function GrokRoastBattle({ streamerName }: GrokRoastBattleProps) {
  const { language } = useLanguage();
  const [battle, setBattle] = useState<{ roast1: string; roast2: string; winner: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const startBattle = async () => {
    setLoading(true);
    try {
      // Call Grok twice for two roasts, then decide winner
      const promptBase = language === "fr" 
        ? `Roast ${streamerName} de manière hilarante et wackée en argot décontracté. Maximum humour et punchlines. Court.`
        : `Roast ${streamerName} hilariously in casual slang. Maximum punchlines and humor. Short.`;

      const [res1, res2] = await Promise.all([
        fetch("/api/grok", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptBase + " Version 1.", maxTokens: 80 }),
        }),
        fetch("/api/grok", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptBase + " Version 2, different angle.", maxTokens: 80 }),
        }),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      
      const roast1 = data1.content || "Ouh là que c'est mauvais!";
      const roast2 = data2.content || "Pire que ça, impossible!";
      
      // Grok decides winner
      const judgePrompt = `Entre ces deux roasts de ${streamerName}: 1. "${roast1}" 2. "${roast2}". Lequel est le plus wacké et drôle ? Dis juste "1" ou "2" et pourquoi en une phrase.`;
      const judgeRes = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: judgePrompt, maxTokens: 60 }),
      });
      const judgeData = await judgeRes.json();
      const judge = judgeData.content || "1 wins because Grok said so.";
      
      const winner = judge.toLowerCase().includes("2") ? "2" : "1";
      
      const finalBattle = {
        roast1,
        roast2,
        winner: winner === "1" ? roast1 : roast2,
      };
      setBattle(finalBattle);
      
      // Speak the winner with real Grok voice
      speakWithCloudGrokVoice(`Winner: ${finalBattle.winner}`, language);
    } catch (e) {
      const fallback = {
        roast1: "Grok a planté le premier roast.",
        roast2: "Le deuxième était pire.",
        winner: "Personne ne gagne, c'est un tie wacké.",
      };
      setBattle(fallback);
      speakWithCloudGrokVoice(fallback.winner, language);
    }
    setLoading(false);
  };

  const speakRoast = (text: string) => {
    speakWithCloudGrokVoice(text, language);
  };

  return (
    <div className="glass p-4 rounded-xl border border-white/[0.07]">
      <div className="flex items-center gap-2 mb-3">
        <Sword className="text-red-500" />
        <h3 className="font-bold text-sm font-display tracking-wide">{language === "fr" ? "GROK ROAST BATTLE" : "GROK ROAST BATTLE"}</h3>
      </div>
      <button
        onClick={startBattle}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
      >
        <Flame /> {loading ? (language === "fr" ? "GROK JUGE..." : "GROK IS JUDGING...") : (language === "fr" ? "DÉMARRER LE ROAST BATTLE" : "START ROAST BATTLE")}
      </button>

      {battle && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="p-2 bg-black/40 rounded border-l-2 border-red-500/70 flex justify-between items-start gap-2">
            <div><strong>Roast 1:</strong> {battle.roast1}</div>
            <button onClick={() => speakRoast(battle.roast1)} className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"><Volume2 size={12} /></button>
          </div>
          <div className="p-2 bg-black/40 rounded border-l-2 border-red-500/70 flex justify-between items-start gap-2">
            <div><strong>Roast 2:</strong> {battle.roast2}</div>
            <button onClick={() => speakRoast(battle.roast2)} className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"><Volume2 size={12} /></button>
          </div>
          <div className="p-2 bg-wacke-cyan/10 rounded border-l-2 border-wacke-cyan/60 text-wacke-cyan font-bold flex justify-between items-start gap-2">
            <div>WINNER: {battle.winner}</div>
            <button onClick={() => speakRoast(battle.winner)} className="p-1 hover:text-white transition-colors shrink-0"><Volume2 size={12} /></button>
          </div>
          <div className="text-[10px] text-center text-gray-400">
            {language === "fr" ? "Jugé par Grok xAI • Maximum wacké" : "Judged by Grok xAI • Maximum wacké"}
          </div>
        </div>
      )}
    </div>
  );
}
