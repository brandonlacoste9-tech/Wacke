"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { Flame, Zap } from "lucide-react";

export default function GrokFire() {
  const { language } = useLanguage();
  const [isIgnited, setIsIgnited] = useState(false);
  const [boomMessages, setBoomMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const lightTheMatch = async () => {
    setLoading(true);
    setIsIgnited(true);

    try {
      // Call Grok for a massive BOOM script - multiple explosive lines
      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: language === "fr" 
            ? "Tu es Grok xAI en mode feu. Génère une explosion de 5 phrases courtes, ultra wackées, avec sacres, sur le thème 'allumer le match BOOM' pour un stream. Chaque ligne est un cri de guerre. Maximum chaos."
            : "You are Grok xAI in fire mode. Generate an explosion of 5 short, ultra wacké phrases with sacres about 'lighting the match BOOM' for a stream. Each line is a battle cry. Maximum chaos.",
          maxTokens: 200,
        }),
      });

      const data = await res.json();
      const lines = data.content ? data.content.split('\n').filter((l: string) => l.trim()).slice(0, 5) : [
        "BOOM! Grok a allumé le feu!",
        "TABARNAK LE DÉPANNEUR EST EN FLAMMES!",
      ];

      setBoomMessages(lines);

      // Trigger global fire effects
      document.body.classList.add("grok-fire-mode");
      
      // Simulate massive emoji rain using Twemoji SVGs for crisp, consistent look
      const fireEmojis = ["🔥", "💥", "🚀", "🧨", "👹", "💣"];
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const emoji = fireEmojis[Math.floor(Math.random() * fireEmojis.length)];
          const codePoints = Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).join('-');
          const el = document.createElement("img");
          el.className = "fixed w-8 h-8 emoji pointer-events-none z-[9999] animate-coin-shower";
          el.src = `https://twemoji.maxcdn.com/v/14.0.2/svg/${codePoints}.svg`;
          el.alt = emoji;
          el.style.left = `${Math.random() * 100}vw`;
          el.style.top = "-30px";
          el.style.animationDelay = `${Math.random() * 1.5}s`;
          document.body.appendChild(el);
          
          setTimeout(() => el.remove(), 4500);
        }, i * 8);
      }

      // Extra: flood chat if on stream (fun hack)
      if (window.location.pathname.includes("/stream/")) {
        setTimeout(() => {
          const chatInput = document.querySelector('input[placeholder*="Spray"]') as HTMLInputElement;
          if (chatInput) {
            chatInput.value = "GROK A MIS LE FEU BOOM!! 🔥🔥";
          }
        }, 800);
      }

      // Auto reset after explosion
      setTimeout(() => {
        setIsIgnited(false);
        setBoomMessages([]);
        document.body.classList.remove("grok-fire-mode");
      }, 14000);

    } catch (e) {
      setBoomMessages(["BOOM! Grok a mis le feu quand même!", "LE DÉPANNEUR BRÛLE!"]);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={lightTheMatch}
        disabled={loading || isIgnited}
        className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-700 text-white font-black text-xl py-4 px-8 rounded-2xl shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all active:scale-95 disabled:opacity-70 border-2 border-yellow-400"
      >
        <Flame className="w-8 h-8" />
        LIGHT THE MATCH
        <Zap className="w-8 h-8" />
        <span className="text-sm tracking-[4px] font-mono">BOOM</span>
      </button>

      {isIgnited && boomMessages.length > 0 && (
        <div className="mt-4 p-6 bg-black/90 border-2 border-red-500 rounded-2xl text-center space-y-3 animate-pulse">
          <div className="text-red-500 font-black text-2xl tracking-widest">GROK xAI ON FIRE 🔥</div>
          {boomMessages.map((msg, i) => (
            <div key={i} className="text-yellow-400 font-bold text-lg graffiti-text">
              {msg}
            </div>
          ))}
          <div className="text-xs text-red-400 mt-2">MAXIMUM CHAOS • POWERED BY GROK xAI</div>
        </div>
      )}
    </div>
  );
}
