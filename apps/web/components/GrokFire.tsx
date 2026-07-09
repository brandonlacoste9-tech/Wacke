"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { Flame, Zap, Volume2 } from "lucide-react";
import { speakWithGrokVoice, speakWithCloudGrokVoice } from "@/lib/audio";

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
      const lines: string[] = data.content 
        ? data.content.split('\n').filter((l: string) => l.trim()).slice(0, 5) 
        : [
            "BOOM! Grok a allumé le feu!",
            "TABARNAK LE DÉPANNEUR EST EN FLAMMES!",
          ];

      setBoomMessages(lines);
      // Speak the fire lines with real Grok xAI cloud voice
      lines.forEach((line, idx) => {
        setTimeout(() => speakWithCloudGrokVoice(line, language), idx * 900);
      });

      // Trigger global fire effects
      document.body.classList.add("grok-fire-mode");

      // Canvas-based emoji rain for smoother, better looking effects (Twemoji style + physics)
      const canvas = document.createElement("canvas");
      canvas.className = "fixed inset-0 pointer-events-none z-[9999]";
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d", { alpha: true })!;

      const fireEmojis = ["🔥", "💥", "🚀", "🧨", "👹", "💣", "🌋", "💀"];
      interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        emoji: string;
        size: number;
        rot: number;
        rotSpeed: number;
        opacity: number;
        twemojiUrl?: string;
      }

      const particles: Particle[] = [];
      const getTwemojiUrl = (emoji: string) => {
        const codePoints = Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).join("-");
        return `https://twemoji.maxcdn.com/v/14.0.2/svg/${codePoints}.svg`;
      };

      // Preload a few Twemoji images for better look
      const twemojiImages: { [key: string]: HTMLImageElement } = {};
      fireEmojis.forEach(emoji => {
        const img = new Image();
        img.src = getTwemojiUrl(emoji);
        twemojiImages[emoji] = img;
      });

      for (let i = 0; i < 80; i++) {
        const emoji = fireEmojis[Math.floor(Math.random() * fireEmojis.length)];
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * -canvas.height * 0.5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 2,
          emoji,
          size: Math.random() * 24 + 18,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 8,
          opacity: Math.random() * 0.6 + 0.6,
        });
      }

      let frame = 0;
      const animateRain = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        particles.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity
          p.rot += p.rotSpeed;
          p.opacity -= 0.0015;

          if (p.y > canvas.height + 50 || p.opacity <= 0) {
            // respawn
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * -100;
            p.vy = Math.random() * 3 + 2;
            p.opacity = Math.random() * 0.6 + 0.6;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.globalAlpha = Math.max(p.opacity, 0);

          const img = twemojiImages[p.emoji];
          if (img && img.complete && img.naturalWidth > 0) {
            // Use Twemoji SVG for crisp look
            ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
          } else {
            // Fallback to native emoji
            ctx.font = `${p.size}px sans-serif`;
            ctx.fillText(p.emoji, 0, 0);
          }
          ctx.restore();
        });

        frame++;
        if (frame < 280) { // ~4.5s at 60fps
          requestAnimationFrame(animateRain);
        } else {
          canvas.remove();
        }
      };
      requestAnimationFrame(animateRain);

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
        className="group w-full md:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-wacke-pink via-orange-500 to-yellow-400 hover:brightness-110 text-white font-black text-base md:text-lg py-3.5 px-7 rounded-2xl shadow-[0_8px_32px_rgba(255,42,133,0.35)] transition-all active:scale-95 disabled:opacity-70 border border-white/15"
      >
        <Flame className="w-5 h-5 shrink-0" />
        <span className="leading-none">{language === "fr" ? "ALLUMER LE MATCH" : "LIGHT THE MATCH"}</span>
        <Zap className="w-5 h-5 shrink-0" />
        <span className="text-[11px] tracking-[3px] font-mono leading-none opacity-90">BOOM</span>
      </button>

      {isIgnited && boomMessages.length > 0 && (
        <div className="mt-4 p-6 bg-black/90 border-2 border-red-500 rounded-2xl text-center space-y-3 animate-pulse">
          <div className="text-red-500 font-black text-2xl tracking-widest">GROK xAI ON FIRE 🔥</div>
          {boomMessages.map((msg, i) => (
            <div key={i} className="text-yellow-400 font-bold text-lg graffiti-text flex items-center justify-center gap-2">
              {msg}
              <button onClick={() => speakWithCloudGrokVoice(msg, language)} className="p-1">
                <Volume2 size={16} />
              </button>
            </div>
          ))}
          <div className="text-xs text-red-400 mt-2">MAXIMUM CHAOS • POWERED BY GROK xAI</div>
        </div>
      )}
    </div>
  );
}
