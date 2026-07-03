"use client";

import { useState } from "react";
import { Copy, Check, Tv } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ObsOverlayButtonProps {
  username: string;
}

export default function ObsOverlayButton({ username }: ObsOverlayButtonProps) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  const handleCopy = () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const url = `${origin}/stream/${username}/overlay`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-wacke-purple/10 border border-wacke-purple/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center space-x-3 text-center sm:text-left">
        <div className="p-2.5 bg-wacke-pink/10 text-wacke-pink rounded-xl">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {language === "fr" ? "Lien d'incrustation OBS" : "OBS Browser Source Overlay"}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {language === "fr" 
              ? "Ajoute ce lien dans OBS pour afficher les alertes de dons, sons et stickers live sur ton stream !"
              : "Add this link as a browser source in OBS to display soundboard, TTS and AI sticker alerts live!"}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95
                   ${copied 
                     ? "bg-green-600/20 border border-green-500/40 text-green-400" 
                     : "bg-wacke-pink/20 hover:bg-wacke-pink/35 border border-wacke-pink/45 text-white"}`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        <span>
          {copied 
            ? (language === "fr" ? "Copié !" : "Copied!") 
            : (language === "fr" ? "Copier le lien" : "Copy Overlay Link")}
        </span>
      </button>
    </div>
  );
}
