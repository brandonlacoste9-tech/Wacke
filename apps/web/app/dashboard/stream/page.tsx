"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

/**
 * Streamer Dashboard — Stream Key Management
 * Allows streamers to create/regenerate their Mux stream key and configure stream settings.
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <div className="min-h-screen bg-wacke-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-wacke-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-wacke-dark px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold graffiti-text neon-pink">TABLEAU DE BORD</h1>
          {streamId && (
            <Link
              href={`/stream/${user.username}`}
              className="text-xs bg-wacke-cyan/20 hover:bg-wacke-cyan/40 border border-wacke-cyan/40 text-wacke-cyan px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
            >
              👁 Voir ma chaîne
            </Link>
          )}
        </div>
        <p className="text-gray-400 mb-10">Configure ton stream et obtiens ta clé RTMP pour OBS.</p>

        {/* ── Stream Config ─────────────────────────────────────────────── */}
        {!streamKey ? (
          <div className="bg-wacke-darker border border-wacke-purple/30 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Titre du stream</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Gaming avec les boys, Chilage du vendredi..."
                maxLength={128}
                className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-xl px-4 py-3
                           text-sm focus:outline-none focus:border-wacke-cyan/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-xl px-4 py-3
                           text-sm focus:outline-none focus:border-wacke-cyan/60 transition-colors"
              >
                {STREAM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-wacke-dark border border-wacke-purple/20 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white">Mode Sacré 🔥</p>
                <p className="text-xs text-gray-500 mt-0.5">Permet les sacres québécois dans le chat</p>
              </div>
              <button
                onClick={() => setSacreMode((prev) => !prev)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  sacreMode ? "bg-red-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    sacreMode ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-xl text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateStream}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-wacke-pink to-wacke-purple py-4 rounded-xl
                         font-bold text-lg hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Création en cours..." : "🔴 Créer mon stream"}
            </button>
          </div>
        ) : (
          /* ── Stream Key Display ────────────────────────────────────────── */
          <div className="bg-wacke-darker border border-green-500/30 rounded-2xl p-8 space-y-6">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold text-green-400">Stream créé! Configure OBS maintenant.</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                URL du serveur RTMP
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-wacke-dark border border-wacke-purple/30 rounded-lg px-4 py-2 text-sm text-wacke-cyan font-mono truncate">
                  {rtmpUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(rtmpUrl || "")}
                  className="text-xs bg-wacke-purple/30 hover:bg-wacke-purple/60 px-3 py-2 rounded-lg transition-colors shrink-0"
                >
                  Copier
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Clé de stream (garde ça secret!)
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-wacke-dark border border-wacke-purple/30 rounded-lg px-4 py-2 text-sm text-yellow-400 font-mono truncate">
                  {keyVisible ? streamKey : "•".repeat(40)}
                </code>
                <button
                  onClick={() => setKeyVisible((prev) => !prev)}
                  className="text-xs bg-wacke-purple/30 hover:bg-wacke-purple/60 px-3 py-2 rounded-lg transition-colors shrink-0"
                >
                  {keyVisible ? "Cacher" : "Voir"}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(streamKey || "")}
                  className="text-xs bg-wacke-purple/30 hover:bg-wacke-purple/60 px-3 py-2 rounded-lg transition-colors shrink-0"
                >
                  Copier
                </button>
              </div>
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Ne partage jamais ta clé de stream. Elle donne accès total à ton canal.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-xl text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-wacke-purple/20 flex space-x-4">
              <button
                onClick={handleEndStream}
                disabled={isLoading}
                className="flex-1 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-400 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
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

