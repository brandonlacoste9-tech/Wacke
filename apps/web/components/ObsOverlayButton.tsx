"use client";

import { useState } from "react";
import { Copy, Check, Tv, Zap, ExternalLink } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ObsOverlayButtonProps {
  username: string;
}

export default function ObsOverlayButton({ username }: ObsOverlayButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isFr = language === "fr";

  const overlayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/stream/${username}/overlay`
      : `https://wacke.live/stream/${username}/overlay`;

  const handleCopy = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(overlayUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-wacke-purple/10 border border-wacke-purple/30 rounded-xl p-4 space-y-3 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="p-2.5 bg-wacke-pink/10 text-wacke-pink rounded-xl">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              {isFr ? "Incrustation OBS + Resonance" : "OBS Overlay + Resonance"}
              <Zap className="w-3 h-3 text-wacke-cyan" />
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isFr
                ? "Alertes chaos + Madness Meter sur ton live en moins de 2 minutes."
                : "Chaos alerts + Madness Meter on your stream in under 2 minutes."}
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold border border-white/15 text-gray-200 hover:bg-white/5 transition-all"
          >
            {open
              ? isFr
                ? "Masquer"
                : "Hide"
              : isFr
                ? "Guide 2 min"
                : "2-min setup"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95
                     ${
                       copied
                         ? "bg-green-600/20 border border-green-500/40 text-green-400"
                         : "bg-wacke-pink/20 hover:bg-wacke-pink/35 border border-wacke-pink/45 text-white"
                     }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>
              {copied
                ? isFr
                  ? "Copié !"
                  : "Copied!"
                : isFr
                  ? "Copier le lien"
                  : "Copy Overlay Link"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2.5 text-[11px] text-gray-300 leading-relaxed">
          <p className="text-[10px] font-black uppercase tracking-widest text-wacke-cyan">
            {isFr ? "Premier chaos en 4 étapes" : "First chaos in 4 steps"}
          </p>
          <ol className="list-decimal list-inside space-y-1.5 marker:text-wacke-pink">
            <li>
              {isFr
                ? "OBS → Sources → + → Navigateur (Browser)"
                : "OBS → Sources → + → Browser"}
            </li>
            <li>
              {isFr ? "Colle l’URL overlay" : "Paste the overlay URL"}{" "}
              <code className="text-[9px] text-wacke-pink/90 break-all">{overlayUrl}</code>
            </li>
            <li>
              {isFr
                ? "Largeur 1920 · Hauteur 1080 · Coche « Contrôle audio via OBS » si tu veux les sons"
                : "Width 1920 · Height 1080 · Enable audio control in OBS if you want SFX"}
            </li>
            <li>
              {isFr
                ? "Demande au chat un Boum / Chaos / TTS — le Resonance Chamber charge jusqu’à 100% → OVERLOAD"
                : "Ask chat for a Boom / Chaos / TTS — the Resonance Chamber charges to 100% → OVERLOAD"}
            </li>
          </ol>
          <a
            href={`/stream/${username}/overlay`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-wacke-cyan hover:underline font-bold"
          >
            <ExternalLink className="w-3 h-3" />
            {isFr ? "Prévisualiser l’overlay" : "Preview overlay"}
          </a>
        </div>
      )}
    </div>
  );
}
