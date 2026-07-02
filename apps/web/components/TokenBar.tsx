"use client";

import { useState } from "react";
import { useTokens } from "@/hooks/useTokens";
import { Heart, ChevronUp, Flame } from "lucide-react";

interface TokenBarProps {
  initialBalance: number;
  streamerId: string;
  streamId: string;
  authToken?: string;
}

const GIFT_PRESETS = [50, 100, 500, 1000];

export default function TokenBar({
  initialBalance,
  streamerId,
  streamId,
  authToken,
}: TokenBarProps) {
  const { balance, isLoading, sendBoum, giftTokens } = useTokens({
    initialBalance,
    authToken,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [boumAnimate, setBoumAnimate] = useState(false);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleBoum = async () => {
    setBoumAnimate(true);
    setTimeout(() => setBoumAnimate(false), 800);
    const { error, message } = await sendBoum(streamerId, streamId);
    showFeedback(error ?? message ?? "");
  };

  const handleGift = async (amount: number) => {
    const { error, message } = await giftTokens(streamerId, amount, streamId);
    showFeedback(error ?? message ?? "");
    setShowGiftPanel(false);
    setCustomAmount("");
  };

  return (
    <div className="fixed bottom-6 right-6 lg:right-[408px] z-50">
      {/* ── Feedback Toast ─────────────────────────────────────────────── */}
      {feedback && (
        <div className="mb-3 px-4 py-2 glass-dark rounded-xl text-xs text-center animate-slide-up font-bold neon-border">
          {feedback}
        </div>
      )}

      {/* ── Boum Animation ─────────────────────────────────────────────── */}
      {boumAnimate && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="animate-coin-float text-2xl">🔥</span>
        </div>
      )}

      {/* ── Gift Panel ─────────────────────────────────────────────────── */}
      {showGiftPanel && (
        <div className="mb-3 p-4 glass-dark rounded-2xl space-y-3 animate-scale-in">
          <p className="text-xs font-bold text-wacke-cyan flex items-center space-x-1">
            <span>Envoyer des tokens</span>
            <Heart className="w-3.5 h-3.5 fill-current" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GIFT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleGift(preset)}
                disabled={isLoading || balance < preset}
                className="bg-wacke-purple/20 hover:bg-wacke-purple/40 border border-wacke-purple/30
                           px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="flex items-center justify-center space-x-1">
                  <span>{preset}</span>
                  <img src="/token.png" alt="Token" className="w-3 h-3 object-contain" />
                </span>
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Montant"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10}
              max={10000}
              className="flex-1 bg-white/3 border border-wacke-purple/20 rounded-xl px-3 py-2
                         text-xs focus:border-wacke-cyan/40 transition-all"
            />
            <button
              onClick={() => handleGift(parseInt(customAmount, 10))}
              disabled={!customAmount || isLoading}
              className="bg-wacke-pink/70 hover:bg-wacke-pink px-3 py-2 rounded-xl text-xs font-bold
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── Main Token Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 glass-dark rounded-2xl px-4 py-3 animate-glow-pulse">
        {/* Balance */}
        <div className="flex items-center space-x-1.5 text-sm font-bold text-yellow-400 mr-1">
          <img src="/token.png" alt="Token" className="h-4 w-4 object-contain rounded-full shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
          <span>{balance.toLocaleString("fr-CA")}</span>
        </div>

        {/* Boum! */}
        <button
          onClick={handleBoum}
          disabled={isLoading || balance < 5}
          className="bg-gradient-to-r from-red-600 to-orange-500 hover:brightness-110
                     px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1
                     transition-all hover:scale-105 active:scale-95 disabled:opacity-30
                     disabled:cursor-not-allowed disabled:hover:scale-100
                     shadow-lg shadow-red-500/20"
          title="Envoyer un Boum! (5 tokens)"
        >
          <Flame className="w-4 h-4 text-white fill-current animate-pulse" />
          <span>BOUM!</span>
        </button>

        {/* Gift */}
        <button
          onClick={() => setShowGiftPanel((prev) => !prev)}
          className="bg-wacke-purple/30 hover:bg-wacke-purple/50 border border-wacke-purple/30
                     px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1
                     transition-all hover:scale-105 active:scale-95"
          title="Envoyer des tokens"
        >
          <Heart className="w-3.5 h-3.5 text-wacke-purple fill-current" />
          <span>DONATION</span>
          <ChevronUp className={`w-3 h-3 transition-transform ${showGiftPanel ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>
  );
}
