"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Copy, Eye, EyeOff, Shield, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const STREAM_CATEGORIES = [
  { value: "gaming", label: "🎮 Gaming" },
  { value: "musique", label: "🎵 Musique" },
  { value: "jeu", label: "🎲 Jeu" },
  { value: "chile", label: "😎 Chilé" },
  { value: "frette", label: "❄️ Frette" },
  { value: "art", label: "🎨 Art" },
  { value: "irl", label: "📍 IRL" },
  { value: "talk", label: "🎤 Talk" },
];

const OBS_STEPS = [
  { step: "Ouvre OBS Studio ou Streamlabs", detail: "Télécharge-le sur obsproject.com si tu l'as pas" },
  { step: "Va dans Paramètres → Flux", detail: "Settings → Stream" },
  { step: "Sélectionne «Personnalisé» comme Service", detail: "Custom..." },
  { step: "Colle l'URL du serveur RTMP", detail: "Le champ «Server» ou «URL»" },
  { step: "Colle ta clé de stream", detail: "Le champ «Stream Key»" },
  { step: "Clique «Démarrer le streaming»", detail: "Start Streaming" },
];

/**
 * Streamer Dashboard — Stream Key Management with OBS guide
 */
export default function StreamDashboardPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gaming");
  const [sacreMode, setSacreMode] = useState(true);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [showOBSGuide, setShowOBSGuide] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text || "");
    setCopyFeedback(`✅ ${label} copié!`);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCreateStream = async () => {
    if (!title.trim()) {
      setError("Donne un titre à ton stream!");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mux/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, category, sacreModeEnabled: sacreMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création du stream");
        return;
      }

      setStreamKey(data.streamKey);
      setRtmpUrl(data.rtmpUrl);
      setStreamId(data.streamId);
    } catch {
      setError("Connexion perdue. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mux/stream", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'arrêt du stream");
        return;
      }

      setStreamKey(null);
      setRtmpUrl(null);
      setStreamId(null);
      setTitle("");
    } catch {
      setError("Connexion perdue. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-wacke-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl md:text-4xl font-black graffiti-text neon-pink flex items-center space-x-3">
            <Radio className="w-8 h-8" />
            <span>TABLEAU DE BORD</span>
          </h1>
          {streamId && (
            <Link
              href={`/stream/${user.username}`}
              className="text-xs bg-wacke-cyan/10 hover:bg-wacke-cyan/20 border border-wacke-cyan/30 text-wacke-cyan px-4 py-2 rounded-xl font-bold transition-all hover:scale-105"
            >
              👁 Voir ma chaîne
            </Link>
          )}
        </div>
        <p className="text-gray-500 mb-10 text-sm">Configure ton stream et obtiens ta clé RTMP pour OBS.</p>

        {/* Copy feedback toast */}
        {copyFeedback && (
          <div className="mb-4 px-4 py-2 glass-dark rounded-xl text-sm font-bold animate-slide-up neon-border text-center">
            {copyFeedback}
          </div>
        )}

        {/* ── Stream Config ─────────────────────────────────────────────── */}
        {!streamKey ? (
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Titre du stream</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Gaming avec les boys, Chilage du vendredi..."
                maxLength={128}
                className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                           text-sm focus:border-wacke-cyan/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                           text-sm focus:border-wacke-cyan/40 transition-all"
              >
                {STREAM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-white/2 border border-wacke-purple/15 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>Mode Sacré 🔥</span>
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Permet les sacres québécois dans le chat</p>
              </div>
              <button
                onClick={() => setSacreMode((prev) => !prev)}
                className={`relative w-12 h-6 rounded-full transition-colors ${sacreMode ? "bg-red-600" : "bg-gray-600"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${sacreMode ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateStream}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-wacke-pink to-wacke-purple py-4 rounded-xl
                         font-bold text-lg hover:opacity-90 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-wacke-pink/20 hover:scale-[1.01]"
            >
              {isLoading ? "Création en cours..." : "🔴 Créer mon stream"}
            </button>
          </div>
        ) : (
          /* ── Stream Key Display ────────────────────────────────────────── */
          <div className="glass-card border-green-500/20 rounded-2xl p-8 space-y-6">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold text-green-400">Stream créé! Configure OBS maintenant.</h2>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                URL du serveur RTMP
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white/3 border border-wacke-purple/20 rounded-lg px-4 py-2.5 text-sm text-wacke-cyan font-mono truncate">
                  {rtmpUrl}
                </code>
                <button
                  onClick={() => handleCopy(rtmpUrl || "", "URL RTMP")}
                  className="flex items-center space-x-1 text-xs bg-wacke-purple/20 hover:bg-wacke-purple/40 px-3 py-2.5 rounded-lg transition-colors shrink-0 font-bold"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copier</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">
                Clé de stream (garde ça secret!)
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white/3 border border-wacke-purple/20 rounded-lg px-4 py-2.5 text-sm text-yellow-400 font-mono truncate">
                  {keyVisible ? streamKey : "•".repeat(40)}
                </code>
                <button
                  onClick={() => setKeyVisible((prev) => !prev)}
                  className="flex items-center space-x-1 text-xs bg-wacke-purple/20 hover:bg-wacke-purple/40 px-3 py-2.5 rounded-lg transition-colors shrink-0 font-bold"
                >
                  {keyVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{keyVisible ? "Cacher" : "Voir"}</span>
                </button>
                <button
                  onClick={() => handleCopy(streamKey || "", "Clé")}
                  className="flex items-center space-x-1 text-xs bg-wacke-purple/20 hover:bg-wacke-purple/40 px-3 py-2.5 rounded-lg transition-colors shrink-0 font-bold"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copier</span>
                </button>
              </div>
              <p className="text-[10px] text-red-400/80 mt-2 font-medium">
                ⚠️ Ne partage jamais ta clé de stream. Elle donne accès total à ton canal.
              </p>
            </div>

            {/* OBS Guide Accordion */}
            <div className="border-t border-wacke-purple/15 pt-4">
              <button
                onClick={() => setShowOBSGuide((prev) => !prev)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-wacke-cyan" />
                  <span className="text-sm font-bold text-wacke-cyan">Guide de configuration OBS</span>
                </div>
                {showOBSGuide ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {showOBSGuide && (
                <div className="mt-4 space-y-3 animate-slide-up">
                  {OBS_STEPS.map((item, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-wacke-pink/20 text-wacke-pink text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{item.step}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-wacke-purple/15 flex space-x-4">
              <button
                onClick={handleEndStream}
                disabled={isLoading}
                className="flex-1 bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-red-400 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Fermeture..." : "⛔ Arrêter le stream"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
