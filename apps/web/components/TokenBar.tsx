"use client";

import { useState } from "react";
import { useTokens } from "@/hooks/useTokens";
import { Heart, ChevronUp, Flame, Bot, Eye, Settings, Sparkles } from "lucide-react";
import TokenShopModal from "./TokenShopModal";
import { useLanguage } from "./LanguageProvider";
import { getRandomGrokTip, GROK_BRAND } from "@/lib/grok-wit";

import { useAuth } from "./AuthProvider";

interface TokenBarProps {
  initialBalance: number;
  streamerId: string;
  streamId: string;
  authToken?: string;
  viewerCount?: number;
}

const GIFT_PRESETS = [50, 100, 500, 1000];

// Quick-fire reaction emotes for the bar's center strip.
const QUICK_EMOTES = [
  { emoji: "🔥", label: "Hype" },
  { emoji: "💀", label: "Dead" },
  { emoji: "🚀", label: "Go" },
  { emoji: "👀", label: "Eyes" },
  { emoji: "⚡", label: "Zap" },
];

export default function TokenBar({
  initialBalance,
  streamerId,
  streamId,
  authToken,
  viewerCount = 0,
}: TokenBarProps) {
  const { token: authClientToken } = useAuth();
  const activeToken = (authToken || authClientToken) ?? undefined;

  const { balance, isLoading, sendBoum, giftTokens } = useTokens({
    initialBalance,
    authToken: activeToken,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [boumAnimate, setBoumAnimate] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [grokChallengeActive, setGrokChallengeActive] = useState(false);
  const [burst, setBurst] = useState<string | null>(null);
  const { t, language } = useLanguage();

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

  // Grok xAI Mini-Game: Quick challenge for bonus tokens (demo)
  const handleGrokChallenge = () => {
    setGrokChallengeActive(true);
    const tip = getRandomGrokTip(language);
    setTimeout(() => {
      const bonus = Math.floor(Math.random() * 150) + 50;
      showFeedback(`${GROK_BRAND}: ${tip} +${bonus} ${language === "fr" ? "jetons" : "tokens"}!`);
      setGrokChallengeActive(false);
    }, 850);
  };

  const handleGift = async (amount: number) => {
    const { error, message } = await giftTokens(streamerId, amount, streamId);
    showFeedback(error ?? message ?? "");
    setShowGiftPanel(false);
    setCustomAmount("");
  };

  // Fire a quick floating emote burst (visual only — feeds the chat vibe)
  const handleEmote = (emoji: string) => {
    setBurst(emoji);
    setTimeout(() => setBurst(null), 900);
  };

  return (
    <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 z-40 px-3 pb-2 md:pb-3 pointer-events-none">
      {/* ── Feedback Toast ─────────────────────────────────────────────── */}
      {feedback && (
        <div className="mb-2 px-4 py-2 glass-dark rounded-xl text-xs text-center animate-slide-up font-bold neon-border pointer-events-none mx-auto w-fit">
          {feedback}
        </div>
      )}

      {/* ── Gift Panel ─────────────────────────────────────────────────── */}
      {showGiftPanel && (
        <div className="mb-2 p-4 glass-dark rounded-2xl space-y-3 animate-scale-in pointer-events-auto max-w-md mx-auto">
          <p className="text-xs font-bold text-wacke-cyan flex items-center space-x-1">
            <span>{language === "fr" ? "Envoyer des tokens" : "Send tokens"}</span>
            <Heart className="w-3.5 h-3.5 fill-current" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GIFT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleGift(preset)}
                disabled={isLoading || balance < preset}
                className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]
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
              placeholder={language === "fr" ? "Montant" : "Amount"}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10}
              max={10000}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2
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

      {/* ── Main Full-Width Action Bar (Kick-inspired) ──────────────────── */}
      <div className="pointer-events-auto mx-auto max-w-[1400px]">
        <div className="relative glass-dark rounded-2xl px-3 sm:px-4 py-2.5 shadow-2xl shadow-black/50 border border-white/[0.08] overflow-hidden">
          {/* Top hairline glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-wacke-pink/40 to-transparent" />

          {/* Boum animation burst */}
          {boumAnimate && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="animate-coin-float text-2xl">🔥</span>
            </div>
          )}
          {burst && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="animate-coin-float text-2xl">{burst}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 justify-between">
            {/* ── Left cluster: LIVE viewers + Token store ─────────────── */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Live viewer count */}
              <div
                className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 rounded-xl px-2.5 py-1.5"
                title={language === "fr" ? "Spectateurs en direct" : "Live viewers"}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <Eye className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-extrabold text-white tabular-nums">
                  {viewerCount.toLocaleString("fr-CA")}
                </span>
              </div>

              {/* Token balance / store */}
              <button
                onClick={() => setIsShopOpen(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-yellow-400 cursor-pointer hover:bg-yellow-500/10 rounded-xl px-2.5 py-1.5 transition-all select-none border border-yellow-500/15 hover:border-yellow-500/30"
                title={language === "fr" ? "Acheter des jetons Wacké" : "Buy Wacké tokens"}
              >
                <img src="/token.png" alt="Token" className="h-4 w-4 object-contain rounded-full shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
                <span className="tabular-nums">{balance.toLocaleString("fr-CA")}</span>
              </button>
            </div>

            {/* ── Center: Quick emote reactions ────────────────────────── */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              {QUICK_EMOTES.map((e) => (
                <button
                  key={e.emoji}
                  onClick={() => handleEmote(e.emoji)}
                  title={e.label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] hover:scale-125 transition-all text-lg active:scale-90"
                >
                  {e.emoji}
                </button>
              ))}
              <div className="w-px h-5 bg-white/10 mx-1" />
              <Sparkles className="w-4 h-4 text-wacke-cyan/70" />
            </div>

            {/* ── Right cluster: Feature actions ──────────────────────── */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Boum! */}
              <button
                onClick={handleBoum}
                disabled={isLoading || balance < 5}
                className="bg-gradient-to-r from-red-600 to-orange-500 hover:brightness-110
                           px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1
                           transition-all hover:scale-105 active:scale-95 disabled:opacity-30
                           disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-lg shadow-red-500/20"
                title={language === "fr" ? "Envoyer un Boum! (5 tokens)" : "Send a Boom! (5 tokens)"}
              >
                <Flame className="w-3.5 h-3.5 text-white fill-current animate-pulse" />
                <span className="hidden sm:inline">BOUM!</span>
              </button>

              {/* Grok xAI Mini-Game */}
              <button
                onClick={handleGrokChallenge}
                disabled={isLoading || grokChallengeActive}
                className="bg-wacke-cyan/10 hover:bg-wacke-cyan/20 border border-wacke-cyan/30 text-wacke-cyan px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                title="Grok xAI Challenge"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GROK</span>
              </button>

              {/* Gift / Donation */}
              <button
                onClick={() => setShowGiftPanel((prev) => !prev)}
                className="bg-wacke-pink/15 hover:bg-wacke-pink/30 border border-wacke-pink/30
                           px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1
                           transition-all hover:scale-105 active:scale-95 text-wacke-pink"
                title={language === "fr" ? "Envoyer des tokens" : "Send tokens"}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">{language === "fr" ? "DON" : "DONATION"}</span>
                <ChevronUp className={`w-3 h-3 transition-transform ${showGiftPanel ? "rotate-180" : ""}`} />
              </button>

              {/* Settings (decorative pin) */}
              <button
                className="hidden md:flex w-8 h-8 items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 hover:text-white transition-all"
                title={language === "fr" ? "Paramètres du stream" : "Stream settings"}
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <TokenShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
    </div>
  );
}
