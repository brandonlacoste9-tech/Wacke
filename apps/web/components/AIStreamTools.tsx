"use client";

import { useState } from "react";
import { generateStreamTitle, generateAIPoll, getRandomAIEvent, generateAIPrediction, AI_BRAND } from "@/lib/ai-wit";
import { useLanguage } from "./LanguageProvider";
import { Sparkles, BarChart3, MessageCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

/**
 * Wacké AI Powered Tools for streamers/viewers
 * - Dynamic title suggestions
 * - Instant AI Polls
 * - Random AI events (for demo)
 */
export default function AIStreamTools({ streamerName }: { streamerName: string }) {
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [poll, setPoll] = useState<{question: string, options: string[]} | null>(null);
  const [aiEvents, setAIEvents] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<{prediction: string, odds: string, confidence: number} | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingPoll, setLoadingPoll] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [betting, setBetting] = useState(false);

  const handleNewTitle = async () => {
    setLoadingTitle(true);
    const newTitle = await generateStreamTitle(`streamer ${streamerName}`, language);
    setCurrentTitle(newTitle);
    setLoadingTitle(false);
  };

  const handleNewPoll = async () => {
    setLoadingPoll(true);
    const newPoll = await generateAIPoll(language);
    setPoll(newPoll);
    setLoadingPoll(false);
  };

  const triggerAIEvent = async () => {
    setLoadingEvent(true);
    const event = await getRandomAIEvent(language);
    setAIEvents(prev => [event, ...prev].slice(0, 3));
    setLoadingEvent(false);
  };

  const handleAIPrediction = async () => {
    setLoadingPrediction(true);
    const result = await generateAIPrediction(streamerName, language);
    setPrediction(result);
    setLoadingPrediction(false);
  };

  const placeAIBet = async () => {
    if (!prediction || !token) {
      if (!token) alert(language === "fr" ? "Vous devez être connecté pour parier" : "You must be logged in to bet");
      return;
    }
    
    setBetting(true);
    try {
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          betAmount,
          odds: prediction.odds,
          prediction: prediction.prediction
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Erreur: ${data.error}`);
      } else {
        const result = data.win 
          ? `${AI_BRAND} WINS. You gained ${data.amount} tokens. Truth hurts.`
          : `${AI_BRAND} CALLED IT WRONG. You lost ${betAmount}. The universe is chaos.`;
        alert(`${AI_BRAND}\n\nPrediction: ${prediction.prediction}\nOdds: ${prediction.odds}\n\n${result}`);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
    } finally {
      setBetting(false);
      setPrediction(null);
    }
  };

  return (
    <div className="glass-hud border border-white/[0.07] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-wacke-cyan">
        <Sparkles className="w-4 h-4" />
        <span className="font-black text-sm tracking-widest font-display">{AI_BRAND}</span>
      </div>

      {/* Live AI Title Generator */}
      <div>
        <button
          onClick={handleNewTitle}
          disabled={loadingTitle}
          className="w-full flex items-center justify-center gap-2 bg-wacke-cyan/10 hover:bg-wacke-cyan/20 border border-wacke-cyan/25 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" /> {loadingTitle ? "..." : (language === "fr" ? "IA: GÉNÉRER UN TITRE LIVE" : "AI: GENERATE LIVE TITLE")}
        </button>
        {currentTitle && (
          <div className="mt-2 p-3 bg-black/40 border border-wacke-cyan/15 rounded-xl text-sm font-medium text-wacke-cyan">
            {currentTitle}
          </div>
        )}
      </div>

      {/* AI Poll */}
      <div>
        <button
          onClick={handleNewPoll}
          disabled={loadingPoll}
          className="w-full flex items-center justify-center gap-2 bg-wacke-purple/10 hover:bg-wacke-purple/20 border border-wacke-purple/25 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          <BarChart3 className="w-4 h-4" /> {loadingPoll ? "..." : (language === "fr" ? "IA: CRÉER UN SONDAGE INSTANTANÉ" : "AI: INSTANT POLL")}
        </button>
        {poll && (
          <div className="mt-2 p-3 bg-black/40 border border-wacke-purple/15 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-wacke-purple">{poll.question}</div>
            {poll.options.map((opt, i) => (
              <div key={i} className="pl-2 text-gray-300 hover:text-white cursor-pointer transition-colors">• {opt}</div>
            ))}
          </div>
        )}
      </div>

      {/* Random AI Events */}
      <div>
        <button
          onClick={triggerAIEvent}
          disabled={loadingEvent}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          <MessageCircle className="w-4 h-4" /> {loadingEvent ? "..." : (language === "fr" ? "DÉCLENCHER UN ÉVÉNEMENT IA" : "TRIGGER AI EVENT")}
        </button>
        {aiEvents.length > 0 && (
          <div className="mt-2 space-y-1 text-[10px]">
            {aiEvents.map((e, i) => (
              <div key={i} className="p-2 bg-wacke-cyan/5 border border-wacke-cyan/10 rounded text-wacke-cyan/90">{e}</div>
            ))}
          </div>
        )}
      </div>

      {/* AI Predictions & Betting */}
      <div>
        <button
          onClick={handleAIPrediction}
          disabled={loadingPrediction}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-wacke-cyan to-purple-500 text-black py-2 rounded-xl text-sm font-black tracking-wider hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4" /> {loadingPrediction ? "..." : (language === "fr" ? "IA: ÉVÉNEMENT CHAOS" : "AI: CHAOS EVENT")} + BET
        </button>
        {prediction && (
          <div className="mt-2 p-3 bg-black/60 border-2 border-wacke-cyan rounded-xl text-xs space-y-2">
            <div className="font-bold text-wacke-cyan mb-1">{language === "fr" ? "PRÉDICTION:" : "PREDICTION:"}</div>
            <div>{prediction.prediction}</div>
            <div className="flex justify-between text-[10px]">
              <span>ODDS: <span className="font-mono text-white">{prediction.odds}</span></span>
              <span>CONFIDENCE: {prediction.confidence}%</span>
            </div>
            <div className="flex gap-2 items-center">
              <input type="range" min="10" max="500" step="10" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value))} className="flex-1" />
              <span className="font-mono text-wacke-cyan w-12 text-right">{betAmount}🪙</span>
            </div>
            <button
                onClick={placeAIBet}
                disabled={betting}
                className="w-full bg-wacke-cyan text-black py-1.5 rounded-lg text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
              >
                {betting ? "..." : (language === "fr" ? `PARIER SUR CETTE PRÉDICTION (${betAmount} 🪙)` : `BET ON PREDICTION (${betAmount} 🪙)`)}
            </button>
            <div className="text-[8px] text-red-400">{language === "fr" ? "Attention: Les paris IA sont véridiques, mais la maison gagne toujours." : "Warning: AI bets are maximally truthful but the house always wins."}</div>
          </div>
        )}
      </div>
    </div>
  );
}
