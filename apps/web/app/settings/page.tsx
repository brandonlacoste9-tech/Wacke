"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { Settings, Shield, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Settings Page — User preferences, bio, display name, stream defaults.
 */
export default function SettingsPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("gaming");
  const [defaultSacreMode, setDefaultSacreMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user, isLoading, router]);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });

      if (res.ok) {
        setFeedback("✅ Profil mis à jour avec succès!");
      } else {
        setFeedback("❌ Erreur lors de la mise à jour");
      }
    } catch {
      setFeedback("❌ Connexion perdue");
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-wacke-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <Link href="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-black graffiti-text neon-pink flex items-center space-x-2">
            <Settings className="w-7 h-7" />
            <span>PARAMÈTRES</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Personnalise ton profil et tes préférences</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-6 px-4 py-3 glass-dark rounded-xl text-sm font-bold animate-slide-up neon-border">
          {feedback}
        </div>
      )}

      {/* ── Profile Section ─────────────────────────────────────────────── */}
      <section className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
          <span>👤</span>
          <span>Profil</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Nom d&apos;affichage
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={64}
              className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                         text-sm focus:border-wacke-cyan/40 transition-all"
              placeholder="Ton nom d'affichage"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={256}
              rows={3}
              className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                         text-sm focus:border-wacke-cyan/40 transition-all resize-none"
              placeholder="Parle de toi en quelques mots..."
            />
            <p className="text-[10px] text-gray-600 mt-1 text-right">{bio.length}/256</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              URL de l&apos;avatar
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                         text-sm focus:border-wacke-cyan/40 transition-all"
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* ── Stream Preferences ──────────────────────────────────────────── */}
      <section className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
          <span>📺</span>
          <span>Préférences de stream</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Catégorie par défaut
            </label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                         text-sm focus:border-wacke-cyan/40 transition-all"
            >
              <option value="gaming">🎮 Gaming</option>
              <option value="musique">🎵 Musique</option>
              <option value="jeu">🎲 Jeu</option>
              <option value="chile">😎 Chilé</option>
              <option value="frette">❄️ Frette</option>
              <option value="art">🎨 Art</option>
              <option value="irl">📍 IRL</option>
              <option value="talk">🎤 Talk</option>
            </select>
          </div>

          <div className="flex items-center justify-between bg-white/2 border border-wacke-purple/15 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white flex items-center space-x-1">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Mode Sacré par défaut</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Permet les sacres québécois dans ton chat</p>
            </div>
            <button
              onClick={() => setDefaultSacreMode((prev) => !prev)}
              className={`relative w-12 h-6 rounded-full transition-colors ${defaultSacreMode ? "bg-red-600" : "bg-gray-600"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${defaultSacreMode ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Save Button ─────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-wacke-pink to-wacke-purple py-4 rounded-xl font-bold text-lg
                   hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6
                   shadow-lg shadow-wacke-pink/20"
      >
        {isSaving ? "Sauvegarde en cours..." : "💾 Sauvegarder les changements"}
      </button>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <section className="glass-card rounded-2xl p-6 border-red-500/20">
        <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center space-x-2">
          <span>⚠️</span>
          <span>Zone dangereuse</span>
        </h2>
        <button
          onClick={logout}
          className="flex items-center space-x-2 bg-red-950/50 hover:bg-red-900/60 border border-red-500/30
                     text-red-400 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter de tous les appareils</span>
        </button>
      </section>
    </div>
  );
}
