"use client";

import { useEffect, useState } from "react";
import {
  downloadBlob,
  renderOverloadClipCard,
  shareClipBlob,
} from "@/lib/clip-export";
import { Download, Share2, X, Copy, Check, Film } from "lucide-react";

interface OverloadClipModalProps {
  open: boolean;
  onClose: () => void;
  caption: string | null;
  streamerName: string;
  streamId: string;
  streamPath: string;
  seed: number;
}

export default function OverloadClipModal({
  open,
  onClose,
  caption,
  streamerName,
  streamId,
  streamPath,
  seed,
}: OverloadClipModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let revoked: string | null = null;
    setBusy(true);
    setStatus(null);

    (async () => {
      try {
        const b = await renderOverloadClipCard({
          caption: caption || "THE CHAMBER JUST DETONATED",
          streamerName,
          streamPath,
          level: 100,
          seed,
        });
        setBlob(b);
        const url = URL.createObjectURL(b);
        revoked = url;
        setPreviewUrl(url);

        // Log clip event (best-effort)
        void fetch("/api/clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streamId,
            streamerName,
            caption: caption || null,
            kind: "overload_card",
          }),
        });
      } catch (e) {
        console.error("[CLIP_RENDER]", e);
        setStatus("Could not render clip card");
      } finally {
        setBusy(false);
      }
    })();

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, caption, streamerName, streamPath, seed, streamId]);

  if (!open) return null;

  const shareText = `🔥 RESONANCE OVERLOAD on @${streamerName} — ${caption || "chamber detonated"} · wacke.live${streamPath}`;

  const handleDownload = () => {
    if (!blob) return;
    downloadBlob(blob, `wacke-overload-${streamerName}.png`);
    setStatus("Downloaded vertical clip card");
  };

  const handleShare = async () => {
    if (!blob) return;
    const result = await shareClipBlob(
      blob,
      `Resonance Overload · @${streamerName}`,
      shareText
    );
    setStatus(
      result === "shared"
        ? "Shared!"
        : result === "downloaded"
          ? "Saved — paste to TikTok / Reels"
          : "Share failed"
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus("Clipboard blocked");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md glass-dark border border-wacke-pink/40 rounded-2xl shadow-[0_0_40px_rgba(255,20,147,0.25)] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-wacke-pink" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">
                Auto Clip Ready
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                Vertical 9:16 — TikTok / Reels / Shorts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="aspect-[9/16] max-h-[42vh] mx-auto rounded-xl overflow-hidden border border-white/10 bg-black">
            {busy && (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                Rendering overload card…
              </div>
            )}
            {!busy && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Overload clip"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {status && (
            <p className="text-[11px] text-center text-wacke-cyan font-bold">
              {status}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={!blob}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-wacke-pink/20 border border-wacke-pink/40 text-white text-[10px] font-bold disabled:opacity-40"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!blob}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-wacke-cyan/15 border border-wacke-cyan/35 text-white text-[10px] font-bold disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Save PNG
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-[10px] font-bold"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied" : "Caption"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
