"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, PictureInPicture2 } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface WackePlayerProps {
  playbackId: string;
  title: string;
  streamerName: string;
  viewerCount: number;
  isLive: boolean;
  kickUsername?: string;
  twitchUsername?: string;
}

/**
 * WackePlayer — HLS video player with Cloudflare Stream integration.
 * Features: Kick/Twitch embeds, theater mode, PiP, fullscreen.
 */
export default function WackePlayer({
  playbackId,
  title,
  streamerName,
  viewerCount,
  isLive,
  kickUsername,
  twitchUsername,
}: WackePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isTheater, setIsTheater] = useState(false);
  const [hostname, setHostname] = useState<string>("");
  const { t } = useLanguage();

  // Cloudflare Stream HLS Manifest
  const hlsUrl = playbackId ? `https://cloudflarestream.com/${playbackId}/manifest/video.m3u8` : "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    if (kickUsername || twitchUsername || !videoRef.current || !playbackId) return;

    const video = videoRef.current;

    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.play().catch(() => {});
      return;
    }

    // All other browsers — use hls.js
    let hls: any;

    import("hls.js").then((module) => {
      const Hls = module.default;

      if (!Hls.isSupported()) {
        setHasError(true);
        return;
      }

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        liveSyncDurationCount: 3,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
          setHasError(true);
          hls.destroy();
        }
      });
    });

    return () => {
      if (hls) hls.destroy();
    };
  }, [playbackId, hlsUrl, kickUsername, twitchUsername]);

  const handlePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.error("PiP not supported:", e);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  // ── Kick Embed ──────────────────────────────────────────────────────────
  if (kickUsername) {
    return (
      <div ref={containerRef} className={`relative w-full bg-black rounded-xl overflow-hidden neon-border ${isTheater ? "max-w-none" : ""}`}>
        <div className="relative aspect-video">
          <iframe
            src={`https://player.kick.com/${kickUsername}?autoplay=true&muted=false`}
            className="w-full h-full border-0"
            scrolling="no"
            allowFullScreen
          />
        </div>
        <div className="p-4 bg-wacke-darker border-t border-wacke-purple/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white truncate max-w-xs">{title}</h2>
              <p className="text-sm text-wacke-cyan font-medium">{streamerName}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-wacke-green/10 border border-wacke-green/30 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-wacke-green animate-pulse" />
                <span className="text-[10px] font-bold text-wacke-green">KICK LIVE</span>
              </div>
              <button onClick={() => setIsTheater(p => !p)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title={t("theaterMode")}>
                {isTheater ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Twitch Embed ────────────────────────────────────────────────────────
  if (twitchUsername) {
    const twitchSrc = hostname
      ? `https://player.twitch.tv/?channel=${twitchUsername}&parent=${hostname}&autoplay=true&muted=false`
      : "";

    return (
      <div ref={containerRef} className={`relative w-full bg-black rounded-xl overflow-hidden neon-border ${isTheater ? "max-w-none" : ""}`}>
        <div className="relative aspect-video">
          {hostname ? (
            <iframe src={twitchSrc} className="w-full h-full border-0" scrolling="no" allowFullScreen />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="p-4 bg-wacke-darker border-t border-wacke-purple/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white truncate max-w-xs">{title}</h2>
              <p className="text-sm text-wacke-cyan font-medium">{streamerName}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-bold text-purple-400">TWITCH LIVE</span>
              </div>
              <button onClick={() => setIsTheater(p => !p)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title={t("theaterMode")}>
                {isTheater ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Mux HLS Player ──────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={`relative w-full bg-black rounded-xl overflow-hidden neon-border ${isTheater ? "max-w-none" : ""}`}>
      <div className="relative aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted={isMuted} />

        {/* Loading overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-wacke-darker/80 animate-fade-in">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-wacke-pink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-wacke-cyan text-xs font-bold">{t("connectingStream")}</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-wacke-darker/90 animate-fade-in">
            <div className="text-center">
              <img src="/offline_mascot.png" alt="Offline" className="w-24 h-24 mx-auto mb-3 opacity-60" />
              <p className="text-wacke-pink font-bold text-sm">{t("streamOffline")}</p>
              <p className="text-gray-500 text-xs mt-1">{t("streamerReturns")}</p>
            </div>
          </div>
        )}

        {/* LIVE badge + viewer count */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center space-x-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>LIVE</span>
            </span>
            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-medium">
              👁 {viewerCount.toLocaleString("fr-CA")}
            </span>
          </div>
        )}

        {/* Player Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-end space-x-2">
            <button onClick={handlePiP} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Picture-in-Picture">
              <PictureInPicture2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsTheater(p => !p)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title={t("theaterMode")}>
              {isTheater ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Player Controls Bar ────────────────────────────────────────────── */}
      <div className="p-4 bg-wacke-darker border-t border-wacke-purple/20">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-bold text-white truncate">{title}</h2>
            <p className="text-sm text-wacke-cyan font-medium">{streamerName}</p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors text-base"
              aria-label={isMuted ? t("unmute") : t("mute")}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-wacke-pink"
              aria-label="Volume"
            />
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title={t("fullscreen")}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
