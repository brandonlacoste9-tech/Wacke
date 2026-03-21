"use client";

import { useState } from "react";

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
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gaming");
  const [sacreMode, setSacreMode] = useState(true);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);

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
        headers: { "Content-Type": "application/json" },
        // In production, include Authorization: Bearer <supabase_access_token>
        body: JSON.stringify({ title, category, sacreModeEnabled: sacreMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création du stream");
        return;
      }

      setStreamKey(data.streamKey);
      setRtmpUrl(data.rtmpUrl);
    } catch {
      setError("Connexion perdue. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-wacke-dark px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold graffiti-text neon-pink mb-2">TABLEAU DE BORD</h1>
        <p className="text-gray-400 mb-10">Configure ton stream et obtiens ta clé RTMP pour OBS.</p>

        {/* ── Stream Config ─────────────────────────────────────────────── */}
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

        {/* ── Stream Key Display ────────────────────────────────────────── */}
        {streamKey && rtmpUrl && (
          <div className="mt-8 bg-wacke-darker border border-green-500/30 rounded-2xl p-8 space-y-5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold text-green-400">Stream créé! Configure OBS maintenant.</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                URL du serveur RTMP
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-wacke-dark border border-wacke-purple/30 rounded-lg px-4 py-2 text-sm text-wacke-cyan font-mono">
                  {rtmpUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(rtmpUrl)}
                  className="text-xs bg-wacke-purple/30 hover:bg-wacke-purple/60 px-3 py-2 rounded-lg transition-colors"
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
                <code className="flex-1 bg-wacke-dark border border-wacke-purple/30 rounded-lg px-4 py-2 text-sm text-yellow-400 font-mono">
                  {keyVisible ? streamKey : "•".repeat(40)}
                </code>
                <button
                  onClick={() => setKeyVisible((prev) => !prev)}
                  className="text-xs bg-wacke-purple/30 hover:bg-wacke-purple/60 px-3 py-2 rounded-lg transition-colors"
                >
                  {keyVisible ? "Cacher" : "Voir"}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(streamKey)}
                  className="text-xs bg-wacke-purple/30 hover:bg-wacke-purple/60 px-3 py-2 rounded-lg transition-colors"
                >
                  Copier
                </button>
              </div>
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Ne partage jamais ta clé de stream. Elle donne accès total à ton canal.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
