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
      setTimeout(() => setToastMsg(null), 2000);

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
    }
  };

  return (
    <div className="relative">
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
