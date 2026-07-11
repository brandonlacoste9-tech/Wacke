"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { Bot, MessageCircle } from "lucide-react";

interface AICoHostProps {
  streamerName: string;
  streamId: string;
}

export default function AICoHost({ streamerName, streamId }: AICoHostProps) {
  const { language, t } = useLanguage();
  const [comment, setComment] = useState<string>("");
  const [isActive, setIsActive] = useState(false);

  const summonAI = async () => {
    setIsActive(true);
    try {
      const res = await fetch("/api/AI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: language === "fr" 
            ? `Tu es le co-hôte AI xAI sur le stream de ${streamerName}. Dis quelque chose de drôle, wacké et pertinent sur le stream en cours. Court, en argot décontracté.`
            : `You are AI xAI co-host on ${streamerName}'s stream. Say something funny, wacké and relevant about the current stream. Short, in casual slang.`,
          maxTokens: 120,
        }),
      });
      const data = await res.json();
      const AIText = data.content || t("aiBackstage");
      setComment(AIText);
      
      // Removed TTS per user request
      // speakWithCloudAIVoice(AIText, language);
    } catch {
      setComment(t("aiErrorCoHost"));
    }
    setTimeout(() => setIsActive(false), 8000);
  };

  return (
    <div className="glass p-4 rounded-xl border border-white/[0.07] flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-wacke-cyan text-sm font-bold font-display tracking-wide">
          <Bot /> {t("aiCohostTitle")}
        </div>
        <button
          onClick={summonAI}
          disabled={isActive}
          className="text-xs px-2.5 py-1 bg-wacke-cyan text-black rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          {isActive ? t("aiSpeaking") : t("aiSummon")}
        </button>
      </div>
      {comment && (
        <div className="text-xs bg-black/30 p-2 rounded border-l-2 border-wacke-cyan/60 text-gray-200 flex items-start gap-2">
          <div className="flex-1">{comment} <span className="text-wacke-cyan/60">— AI xAI</span></div>
        </div>
      )}
      <div className="text-[10px] text-gray-400">
        {t("aiHint")}
      </div>
    </div>
  );
}
