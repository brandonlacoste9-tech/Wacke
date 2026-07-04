"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useAuth } from "./AuthProvider";

interface ReactionButtonProps {
  streamerId: string;
  streamId: string;
  authToken?: string;
  onReact?: () => void;
}

export default function ReactionButton({
  streamerId,
  streamId,
  authToken,
  onReact,
}: ReactionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [grokComment, setGrokComment] = useState<string | null>(null);
  const router = useRouter();
  const { t, language } = useLanguage();
  const { token: authClientToken } = useAuth();
  
  const activeToken = (authToken || authClientToken) ?? undefined;

  const handleReact = async () => {
    if (!activeToken) {
      setToastMsg(language === "fr" ? "Connecte-toi pour envoyer un BOUM!" : "Log in to send a BOOM!");
      setTimeout(() => setToastMsg(null), 3000);
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    setToastMsg(null);
    setGrokComment(null);

    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          action: "boum",
          toUserId: streamerId,
          streamId,
          amount: 5,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToastMsg(data.error || (language === "fr" ? "Erreur." : "Error."));
        setTimeout(() => setToastMsg(null), 3000);
        return;
      }

      setToastMsg(language === "fr" ? "BOUM! Épique!" : "BOOM! Epic!");

      // Grok on fire comment
      try {
        const grokRes = await fetch("/api/grok", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: language === "fr" 
              ? `Réponds en une phrase drôle et wackée à un viewer qui vient de faire un BOUM! sur ${streamerId}. Utilise sacre si ça fit.`
              : `Respond in one funny wacké sentence to a viewer who just Boum!'d on ${streamerId}. Use sacre if it fits.`,
            maxTokens: 40,
          }),
        });
        const grokData = await grokRes.json();
        if (grokData.content) setGrokComment(grokData.content);
      } catch {}

      // Trigger callback to update balance globally or trigger animation
      if (onReact) {
        onReact();
      }

      // Refresh page elements (like local token balances)
      router.refresh();
    } catch {
      setToastMsg(t("connectionLost"));
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setToastMsg(null);
        setGrokComment(null);
      }, 3500);
    }
  };

  return (
    <div className="relative">
      {grokComment && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-wacke-cyan text-[10px] px-2 py-0.5 rounded border border-wacke-cyan/30 whitespace-nowrap z-50">
          {grokComment} 🔥
        </div>
      )}
      <button
        onClick={handleReact}
        disabled={isLoading}
        className="bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 active:scale-95 border border-red-500/40 px-5 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105"
      >
        <Flame className="w-5 h-5 text-white fill-current animate-pulse" />
        <span>BOUM!</span>
      </button>

      {toastMsg && (
        <div className="absolute left-0 top-12 z-50 bg-wacke-darker border border-red-500/40 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xl neon-border whitespace-nowrap animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
