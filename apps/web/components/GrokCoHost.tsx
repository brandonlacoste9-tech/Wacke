"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { Bot, MessageCircle } from "lucide-react";

interface GrokCoHostProps {
  streamerName: string;
  streamId: string;
}

export default function GrokCoHost({ streamerName, streamId }: GrokCoHostProps) {
  const { language, t } = useLanguage();
  const [comment, setComment] = useState<string>("");
  const [isActive, setIsActive] = useState(false);

  const summonGrok = async () => {
    setIsActive(true);
    try {
      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: language === "fr" 
            ? `Tu es le co-hôte Grok xAI sur le stream de ${streamerName}. Dis quelque chose de drôle, wacké et pertinent sur le stream en cours. Court, en argot québécois.`
            : `You are Grok xAI co-host on ${streamerName}'s stream. Say something funny, wacké and relevant about the current stream. Short, in Quebec slang.`,
          maxTokens: 120,
        }),
      });
      const data = await res.json();
      setComment(data.content || t("grokBackstage"));
    } catch {
      setComment(t("grokErrorCoHost"));
    }
    setTimeout(() => setIsActive(false), 8000);
  };

  return (
    <div className="glass p-4 rounded-xl border border-wacke-cyan/30 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-wacke-cyan text-sm font-bold">
          <Bot /> {t("grokCohostTitle")}
        </div>
        <button 
          onClick={summonGrok}
          disabled={isActive}
          className="text-xs px-2 py-1 bg-wacke-cyan text-black rounded font-bold"
        >
          {isActive ? t("grokSpeaking") : t("grokSummon")}
        </button>
      </div>
      {comment && (
        <div className="text-xs bg-black/30 p-2 rounded border-l-2 border-wacke-cyan text-gray-200">
          {comment} <span className="text-wacke-cyan/60">— Grok xAI</span>
        </div>
      )}
      <div className="text-[9px] text-gray-500">
        {t("grokHint")}
      </div>
    </div>
  );
}
