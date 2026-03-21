"use client";

import { useEffect, useRef, useState } from "react";

interface WackePlayerProps {
  playbackId: string;
  title: string;
  streamerName: string;
  viewerCount: number;
  isLive: boolean;
}

/**
 * WackePlayer — HLS video player with Mux integration.
 *
 * Uses hls.js for native HLS playback in browsers that don't support it natively.
 * Falls back to native <video> HLS for Safari.
 * Styled with Wacké's cyberpunk neon aesthetic.
 */
export default function WackePlayer({
  playbackId,
  title,
  streamerName,
  viewerCount,
  isLive,
}: WackePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  useEffect(() => {
    if (!videoRef.current || !playbackId) return;

    const video = videoRef.current;

    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.play().catch(() => {
        // Autoplay blocked — user must interact
      });
      return;
    }

    // All other browsers — use hls.js
    let Hls: typeof import("hls.js").default;

    import("hls.js").then((module) => {
      Hls = module.default;

      if (!Hls.isSupported()) {
        setHasError(true);
        return;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,         // Critical for live streaming
        backBufferLength: 30,
        maxBufferLength: 10,          // Keep buffer lean for low latency
        liveSyncDurationCount: 3,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHasError(true);
          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
      };
    });
  }, [playbackId, hlsUrl]);

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

  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden neon-border">
      {/* ── Video Element ──────────────────────────────────────────────────── */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted={isMuted}
        />

        {/* Loading overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-wacke-darker/80">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-wacke-pink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-wacke-cyan text-sm font-bold">Connexion au stream...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-wacke-darker/90">
            <div className="text-center">
              <p className="text-4xl mb-3">📡</p>
              <p className="text-wacke-pink font-bold">Stream hors ligne</p>
              <p className="text-gray-400 text-sm mt-1">Le streamer revient bientôt...</p>
            </div>
          </div>
        )}

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>LIVE</span>
            </span>
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              👁 {viewerCount.toLocaleString("fr-CA")}
            </span>
          </div>
        )}
      </div>

      {/* ── Player Controls ────────────────────────────────────────────────── */}
      <div className="p-4 bg-wacke-darker border-t border-wacke-purple/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white truncate max-w-xs">{title}</h2>
            <p className="text-sm text-wacke-cyan">{streamerName}</p>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors text-lg"
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-wacke-pink"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
