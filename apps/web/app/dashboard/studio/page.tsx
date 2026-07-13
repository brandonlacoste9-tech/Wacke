"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Radio,
  Square,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

type MuxCreds = {
  streamKey: string;
  playbackId: string;
  rtmpUrl: string;
  rtmpsUrl: string;
  hlsUrl: string;
  liveStreamId: string;
};

export default function StudioPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isLoading, token } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mux, setMux] = useState<MuxCreds | null>(null);
  const [title, setTitle] = useState("Live sur Wacké");
  const [copied, setCopied] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Local camera preview only (Mux uses OBS/RTMP for actual broadcast)
  useEffect(() => {
    let media: MediaStream | null = null;
    async function setupCamera() {
      try {
        media = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setStream(media);
        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }
      } catch {
        // Camera optional for OBS-only streamers
      }
    }
    void setupCamera();
    return () => {
      media?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch("/api/stream/mux", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.configured && data.streamKey) {
          setMux({
            streamKey: data.streamKey,
            playbackId: data.playbackId,
            rtmpUrl: data.rtmpUrl,
            rtmpsUrl: data.rtmpsUrl,
            hlsUrl: data.hlsUrl,
            liveStreamId: data.liveStreamId,
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [token]);

  async function createMuxStream() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/mux", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Mux error");
      }
      setMux({
        streamKey: data.streamKey,
        playbackId: data.playbackId,
        rtmpUrl: data.rtmpUrl,
        rtmpsUrl: data.rtmpsUrl,
        hlsUrl: data.hlsUrl,
        liveStreamId: data.liveStreamId,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function setLiveStatus(status: "live" | "offline") {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/mux/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status error");
      setIsLive(status === "live");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function copy(label: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="p-8 text-center animate-pulse text-zinc-400">
        Chargement...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
          <span className="gradient-text-cyber">{t("dashStudioTitle")}</span>
        </h1>
        <p className="mt-1.5 text-gray-400">
          Diffuse avec <strong className="text-white">OBS + Mux</strong> (RTMP).
          Aperçu caméra local optionnel.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Preview */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
                Caméra optionnelle (OBS suffit)
              </div>
            )}
            {isLive && (
              <span className="absolute left-3 top-3 rounded-lg bg-red-600 px-2 py-1 text-[11px] font-black text-white">
                LIVE
              </span>
            )}
          </div>
          <div className="flex gap-2 border-t border-white/10 p-3">
            <button
              type="button"
              onClick={toggleVideo}
              className="rounded-lg border border-white/10 p-2 text-white hover:bg-white/5"
            >
              {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button
              type="button"
              onClick={toggleAudio}
              className="rounded-lg border border-white/10 p-2 text-white hover:bg-white/5"
            >
              {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
          </div>
        </div>

        {/* Mux credentials */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Titre du live
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-500/50"
            />
          </div>

          {!mux ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void createMuxStream()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 py-3 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-50"
            >
              <Radio size={16} />
              {busy ? "…" : "Créer mon stream Mux"}
            </button>
          ) : (
            <>
              <CredRow
                label="Serveur RTMPS (OBS)"
                value={mux.rtmpsUrl}
                copied={copied === "rtmp"}
                onCopy={() => copy("rtmp", mux.rtmpsUrl)}
              />
              <CredRow
                label="Clé de stream (secret)"
                value={mux.streamKey}
                copied={copied === "key"}
                onCopy={() => copy("key", mux.streamKey)}
                secret
              />
              <CredRow
                label="Playback (HLS)"
                value={mux.hlsUrl}
                copied={copied === "hls"}
                onCopy={() => copy("hls", mux.hlsUrl)}
              />

              <div className="flex flex-wrap gap-2 pt-2">
                {!isLive ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setLiveStatus("live")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <Radio size={16} />
                    Marquer LIVE sur Wacké
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setLiveStatus("offline")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 py-3 text-sm font-bold text-white hover:bg-white/5 disabled:opacity-50"
                  >
                    <Square size={16} />
                    Fin du live
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createMuxStream()}
                  className="rounded-xl border border-white/15 px-4 py-3 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Rafraîchir clés
                </button>
              </div>

              <ol className="list-decimal space-y-1 pl-4 text-xs text-zinc-500">
                <li>Ouvre OBS → Paramètres → Diffusion</li>
                <li>Service: Personnalisé</li>
                <li>Colle serveur RTMPS + clé</li>
                <li>Démarre le streaming dans OBS</li>
                <li>Clique « Marquer LIVE » ici</li>
              </ol>

              {user.username && (
                <a
                  href={`/stream/${user.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-sm font-bold text-fuchsia-400 hover:underline"
                >
                  Voir ta page stream →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CredRow({
  label,
  value,
  onCopy,
  copied,
  secret,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  secret?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-black/50 px-2 py-2 text-xs text-zinc-300">
          {secret ? "•".repeat(Math.min(24, value.length)) + value.slice(-4) : value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
