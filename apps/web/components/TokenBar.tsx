"use client";

import { useState } from "react";
import { useTokens } from "@/hooks/useTokens";
import { Heart } from "lucide-react";

interface TokenBarProps {
  initialBalance: number;
  streamerId: string;
  streamId: string;
  authToken?: string;
}

const GIFT_PRESETS = [50, 100, 500, 1000];

/**
 * TokenBar — Floating token economy UI for the stream page.
 * Displays the viewer's balance and provides Boum! + gift controls.
 */
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

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleBoum = async () => {
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
    <div className="fixed bottom-6 right-6 z-50">
      {/* ── Feedback Toast ─────────────────────────────────────────────── */}
      {feedback && (
        <div className="mb-3 px-4 py-2 bg-wacke-darker border border-wacke-purple/40 rounded-xl text-sm text-center animate-fade-in neon-border">
          {feedback}
        </div>
      )}

      {/* ── Gift Panel ─────────────────────────────────────────────────── */}
      {showGiftPanel && (
        <div className="mb-3 p-4 bg-wacke-darker border border-wacke-purple/40 rounded-xl space-y-3 animate-fade-in">
          <p className="text-sm font-bold text-wacke-cyan flex items-center space-x-1">
            <span>Envoyer des tokens</span>
            <Heart className="w-4 h-4 fill-current" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GIFT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleGift(preset)}
                disabled={isLoading || balance < preset}
                className="bg-wacke-purple/30 hover:bg-wacke-purple/60 border border-wacke-purple/40
                           px-3 py-2 rounded-lg text-sm font-bold transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center space-x-1">
                  <span>{preset}</span>
                  <img src="/token.png" alt="Token" className="w-3 h-3 object-contain drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
                </span>
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Montant personnalisé"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10}
              max={10000}
              className="flex-1 bg-wacke-dark border border-wacke-purple/40 rounded-lg px-3 py-2
                         text-sm focus:outline-none focus:border-wacke-cyan/60"
            />
            <button
              onClick={() => handleGift(parseInt(customAmount, 10))}
              disabled={!customAmount || isLoading}
              className="bg-wacke-pink/80 hover:bg-wacke-pink px-3 py-2 rounded-lg text-sm font-bold
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── Main Token Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 bg-wacke-darker border border-wacke-purple/40 rounded-2xl px-4 py-3 neon-border">
        {/* Balance display */}
        <div className="flex items-center space-x-1 text-sm font-bold text-yellow-400 mr-2">
          <img src="/token.png" alt="Token" className="h-4 w-4 object-contain rounded-full shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
          <span>{balance.toLocaleString("fr-CA")}</span>
        </div>

        {/* Boum! button */}
        <button
          onClick={handleBoum}
          disabled={isLoading || balance < 5}
          className="bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90
                     px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-1
                     transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed
                     disabled:hover:scale-100"
          title="Envoyer un Boum! (5 tokens)"
        >
          <img src="/fire.png" alt="Fire" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(255,69,0,0.8)]" />
          <span>BOUM!</span>
        </button>

        {/* Gift button */}
        <button
          onClick={() => setShowGiftPanel((prev) => !prev)}
          className="bg-wacke-purple/40 hover:bg-wacke-purple/70 border border-wacke-purple/40
                     px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-1
                     transition-all hover:scale-105"
          title="Envoyer des tokens"
        >
          <Heart className="w-4 h-4 text-wacke-purple fill-current" />
          <span>DON</span>
        </button>
      </div>
    </div>
  );
}
