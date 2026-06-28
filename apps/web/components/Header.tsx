"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

/**
 * Wacké Global Header
 * Sticky, glassmorphism-style header with navigation, search, and auth/token display.
 */
export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout, claimDailyTokens, isLoading } = useAuth();
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const router = useRouter();

  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimFeedback(null);
    const res = await claimDailyTokens();
    setIsClaiming(false);
    
    if (res.success) {
      setClaimFeedback(res.message || "Jetons réclamés!");
    } else {
      setClaimFeedback(res.error || "Erreur de réclamation.");
    }
    setTimeout(() => setClaimFeedback(null), 3000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-wacke-darker/90 backdrop-blur-md border-b border-wacke-purple/30">
      <div className="flex items-center justify-between px-6 py-3">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="text-2xl font-bold graffiti-text neon-pink group-hover:opacity-80 transition-opacity">
            WACKÉ
          </span>
          <span className="text-xs text-gray-500 hidden sm:block">🇶🇨</span>
        </Link>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/browse" className="text-sm text-gray-300 hover:text-wacke-cyan transition-colors font-medium">
            Parcourir
          </Link>
          <Link href="/browse?category=gaming" className="text-sm text-gray-300 hover:text-wacke-cyan transition-colors font-medium">
            Gaming
          </Link>
          <Link href="/browse?category=musique" className="text-sm text-gray-300 hover:text-wacke-cyan transition-colors font-medium">
            Musique
          </Link>
          <Link href="/browse?category=irl" className="text-sm text-gray-300 hover:text-wacke-cyan transition-colors font-medium">
            IRL
          </Link>
        </nav>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Chercher un stream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-wacke-dark border border-wacke-purple/40 rounded-lg pl-4 pr-10 py-2
                         text-sm w-64 focus:outline-none focus:border-wacke-cyan/60 transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              🔍
            </button>
          </div>
        </form>

        {/* ── Auth / Token Area ─────────────────────────────────────────── */}
        <div className="flex items-center space-x-3">
          {!isLoading && user ? (
            <>
              {/* Claim Feedback Toast */}
              {claimFeedback && (
                <div className="absolute top-16 right-6 bg-wacke-darker border border-wacke-purple/40 rounded-xl px-4 py-2 text-xs font-bold shadow-xl neon-border text-white animate-fade-in z-50">
                  {claimFeedback}
                </div>
              )}

              {/* Tokens Display */}
              <div className="flex items-center space-x-2 bg-wacke-dark border border-yellow-500/30 rounded-lg px-3 py-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-bold text-yellow-400">{user.tokenBalance}</span>
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 px-2 py-0.5 rounded font-bold transition-colors disabled:opacity-50"
                  title="Réclamer ton bonus quotidien de 500 jetons"
                >
                  Réclamer
                </button>
              </div>

              {/* Streamer Link */}
              <Link
                href="/dashboard/stream"
                className="hidden sm:block bg-wacke-pink/20 hover:bg-wacke-pink/40 border border-wacke-pink/40
                           text-wacke-pink text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                🔴 Streamer
              </Link>

              {/* User Signout */}
              <button
                onClick={logout}
                className="bg-wacke-purple/20 hover:bg-wacke-purple/40 border border-wacke-purple/40 text-white text-sm
                           font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            !isLoading && (
              <Link
                href="/auth/login"
                className="bg-gradient-to-r from-wacke-pink to-wacke-purple text-white text-sm
                           font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Connexion
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}

