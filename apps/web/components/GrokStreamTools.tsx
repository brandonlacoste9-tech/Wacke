"use client";

import { useState } from "react";
import { generateGrokResponse, generateGrokPoll, getRandomGrokEvent, generateGrokPrediction, generateChaosEvent, GROK_BRAND } from "@/lib/grok-wit";
import { useLanguage } from "./LanguageProvider";
import { Sparkles, BarChart3, MessageCircle, TrendingUp } from "lucide-react";

/**
 * Grok xAI Powered Tools for streamers/viewers
 * - Dynamic title suggestions
 * - Instant Grok Polls
 * - Random Grok events (for demo)
 */
export default function GrokStreamTools({ streamerName }: { streamerName: string }) {
  const { language } = useLanguage();
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [poll, setPoll] = useState<ReturnType<typeof generateGrokPoll> | null>(null);
  const [grokEvents, setGrokEvents] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<ReturnType<typeof generateGrokPrediction> | null>(null);
  const [betAmount, setBetAmount] = useState(50);

  const handleNewTitle = async () => {
    const prompt = `Génère un titre de stream hilarant, wacké et québécois pour le streamer ${streamerName}. Utilise des sacres et de l'humour dépanneur.`;
    const newTitle = await generateGrokResponse(prompt, language);
    setCurrentTitle(newTitle);
  };

  const handleNewPoll = () => {
    setPoll(generateGrokPoll(language));
  };

  const triggerGrokEvent = () => {
    const event = getRandomGrokEvent(language);
    setGrokEvents(prev => [event, ...prev].slice(0, 3));
  };

  const handleGrokPrediction = async () => {
    const prompt = `Crée une prédiction drôle et précise pour le stream de ${streamerName}. Inclus des odds et un niveau de confiance. Réponds en format court.`;
    const raw = await generateGrokResponse(prompt, language);
    // Parse a bit or use as is
    setPrediction({
      prediction: raw,
      odds: `${(1.5 + Math.random()).toFixed(1)}x`,
      confidence: 70 + Math.floor(Math.random() * 25)
    });
  };

  const placeGrokBet = () => {
    if (!prediction) return;
    const win = Math.random() > 0.4; // Grok is "honest" but chaotic
    const multiplier = parseFloat(prediction.odds);
    const result = win 
      ? `GROK xAI WINS. You gained ${Math.floor(betAmount * multiplier)} tokens. Truth hurts.`
      : `GROK xAI CALLED IT WRONG (rare). You lost ${betAmount}. The universe is chaos.`;
    alert(`${GROK_BRAND}\n\nPrediction: ${prediction.prediction}\nOdds: ${prediction.odds}\n\n${result}`);
    setPrediction(null);
  };

  return (
    <div className="bg-wacke-darker border border-wacke-cyan/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-wacke-cyan">
        <Sparkles className="w-4 h-4" />
        <span className="font-bold text-sm tracking-widest">{GROK_BRAND}</span>
      </div>

      {/* Live Grok Title Generator */}
      <div>
        <button
          onClick={handleNewTitle}
          className="w-full flex items-center justify-center gap-2 bg-wacke-cyan/10 hover:bg-wacke-cyan/20 border border-wacke-cyan/30 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <Sparkles className="w-4 h-4" /> GROK: GÉNÉRER UN TITRE LIVE
        </button>
        {currentTitle && (
          <div className="mt-2 p-3 bg-black/40 border border-wacke-cyan/20 rounded-xl text-sm font-medium text-wacke-cyan">
            {currentTitle}
          </div>
        )}
      </div>

      {/* Grok Poll */}
      <div>
        <button
          onClick={handleNewPoll}
          className="w-full flex items-center justify-center gap-2 bg-wacke-purple/10 hover:bg-wacke-purple/20 border border-wacke-purple/30 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <BarChart3 className="w-4 h-4" /> GROK: CRÉER UN SONDAGE INSTANTANÉ
        </button>
        {poll && (
          <div className="mt-2 p-3 bg-black/40 border border-wacke-purple/20 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-wacke-purple">{poll.question}</div>
            {poll.options.map((opt, i) => (
              <div key={i} className="pl-2 text-gray-400 hover:text-white cursor-pointer">• {opt}</div>
            ))}
          </div>
        )}
      </div>

      {/* Random Grok Events */}
      <div>
        <button
          onClick={triggerGrokEvent}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <MessageCircle className="w-4 h-4" /> DÉCLENCHER UN ÉVÉNEMENT GROK
        </button>
        {grokEvents.length > 0 && (
          <div className="mt-2 space-y-1 text-[10px]">
            {grokEvents.map((e, i) => (
              <div key={i} className="p-2 bg-wacke-cyan/5 border border-wacke-cyan/10 rounded text-wacke-cyan/90">{e}</div>
            ))}
          </div>
        )}
      </div>

      {/* Grok xAI Predictions & Broken Betting – Go Further */}
      <div>
        <button
          onClick={handleGrokPrediction}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-wacke-cyan to-purple-500 text-black py-2 rounded-xl text-sm font-black tracking-wider hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <TrendingUp className="w-4 h-4" /> GROK xAI PREDICTION + BET (BREAK THE ECONOMY)
        </button>
        {prediction && (
          <div className="mt-2 p-3 bg-black/60 border-2 border-wacke-cyan rounded-xl text-xs space-y-2">
            <div className="font-bold text-wacke-cyan">{prediction.prediction}</div>
            <div className="flex justify-between text-[10px]">
              <span>ODDS: <span className="font-mono text-white">{prediction.odds}</span></span>
              <span>CONFIDENCE: {prediction.confidence}%</span>
            </div>
            <div className="flex gap-2 items-center">
              <input type="range" min="10" max="500" step="10" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value))} className="flex-1" />
              <span className="font-mono text-wacke-cyan w-12 text-right">{betAmount}🪙</span>
              <button onClick={placeGrokBet} className="bg-white text-black px-3 py-0.5 text-[10px] font-black rounded">BET</button>
            </div>
            <div className="text-[8px] text-red-400">Warning: Grok bets are maximally truthful but the house (xAI) always wins in the end.</div>
          </div>
        )}
      </div>

      <div className="text-[9px] text-center text-gray-500 pt-1">Everything above is powered by Grok xAI (demo mode – we broke the app on purpose)</div>
    </div>
  );
}
