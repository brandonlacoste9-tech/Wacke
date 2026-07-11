"use client";

import { useState } from "react";
import { generateAIResponse, AI_BRAND } from "@/lib/ai-wit";
import { useLanguage } from "./LanguageProvider";
import { Flame } from "lucide-react";

export default function AIRoastButton({ username }: { username: string }) {
  const { language } = useLanguage();
  const [roast, setRoast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoast = async () => {
    setLoading(true);
    const prompt = `Roast the streamer @${username} in a funny, loving but brutally honest wacké way. Use punchlines and slang if it fits.`;
    const r = await generateAIResponse(prompt, language);
    setRoast(r);
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleRoast}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/80 to-orange-500/80 hover:from-red-600 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
      >
        <Flame className="w-4 h-4" /> {loading ? "AI IS COOKING..." : "GET AI xAI ROAST"}
      </button>

      {roast && (
        <div className="mt-3 p-4 border border-red-500/30 bg-red-950/20 rounded-2xl text-sm text-red-300">
          <div className="font-mono text-[10px] text-red-400 mb-1">{AI_BRAND}</div>
          {roast}
        </div>
      )}
    </div>
  );
}
