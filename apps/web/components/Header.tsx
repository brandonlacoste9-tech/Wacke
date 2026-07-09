"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { Search, Palette, Bot } from "lucide-react";
import NotificationBell from "./NotificationBell";
import UserDropdown from "./UserDropdown";
import { useLanguage } from "./LanguageProvider";
import TokenShopModal from "./TokenShopModal";

/**
 * Wacké Global Header
 * Sticky glassmorphism header with navigation, search, notifications, and user menu.
 */
export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [grokChaos, setGrokChaos] = useState(false);
  const [grokFuego, setGrokFuego] = useState(false);
  const [grokMenuOpen, setGrokMenuOpen] = useState(false);
  const { user, claimDailyTokens, isLoading, refreshUser } = useAuth();
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [coinAnimate, setCoinAnimate] = useState(false);
  const router = useRouter();

  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<"cyber" | "graffiti" | "gold">("cyber");
  
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [showGoldRain, setShowGoldRain] = useState(false);

  // Check URL parameters for successful checkout
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("stripe-success") === "true") {
        setShowGoldRain(true);
        refreshUser();

        // Clean the query parameters from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // Stop coin animation after 4 seconds
        const timer = setTimeout(() => {
          setShowGoldRain(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [refreshUser]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("wacke-theme") as any;
    if (savedTheme && ["cyber", "graffiti", "gold"].includes(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (t: "cyber" | "graffiti" | "gold") => {
    const root = document.documentElement;
    root.classList.remove("theme-cyber", "theme-graffiti", "theme-gold");
    if (t !== "cyber") {
      root.classList.add(`theme-${t}`);
    }
  };

  const cycleTheme = () => {
    let next: "cyber" | "graffiti" | "gold" = "cyber";
    if (theme === "cyber") next = "graffiti";
    else if (theme === "graffiti") next = "gold";
    else next = "cyber";

    setTheme(next);
    localStorage.setItem("wacke-theme", next);
    applyTheme(next);
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimFeedback(null);
    const res = await claimDailyTokens();
    setIsClaiming(false);

    if (res.success) {
      setClaimFeedback(res.message || t("claimSuccess"));
      setCoinAnimate(true);
      setTimeout(() => setCoinAnimate(false), 1000);
    } else {
      setClaimFeedback(res.error || t("claimAlready"));
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
    <header className="sticky top-0 z-50 glass-hud border-b border-wacke-purple/20">
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
          <img
            src="/logo_w.png"
            alt="Wacké Logo"
            className="h-8 w-8 object-contain rounded-md shadow-[0_0_12px_rgba(255,0,255,0.4)] group-hover:shadow-[0_0_20px_rgba(255,0,255,0.6)] transition-shadow"
          />
          <span className="text-2xl font-bold graffiti-text neon-pink group-hover:opacity-80 transition-opacity hidden sm:block">
            WACKÉ
          </span>
          <span className="hidden md:inline text-[10px] font-mono tracking-widest text-wacke-cyan/70 border border-wacke-cyan/30 px-1.5 py-0.5 rounded ml-1.5">POWERED BY GROK xAI</span>
        </Link>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center space-x-1 mx-6">
          {[
            { href: "/browse", label: t("browse") },
            { href: "/browse?category=gaming", label: t("gaming") },
            { href: "/browse?category=musique", label: t("music") },
            { href: "/browse?category=irl", label: t("irl") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg
                         hover:bg-white/5 transition-all font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl pl-4 pr-10 py-2
                         text-sm focus:border-wacke-cyan/40 focus:bg-white/5 transition-all
                         placeholder:text-gray-600"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-wacke-cyan transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* ── Auth / Token Area ─────────────────────────────────────────── */}
        <div className="flex items-center space-x-2">
          {!isLoading && user ? (
            <>
              {/* Claim Feedback Toast */}
              {claimFeedback && (
                <div className="absolute top-14 right-6 glass-dark rounded-xl px-4 py-2 text-xs font-bold shadow-xl animate-slide-up z-50 neon-border">
                  {claimFeedback}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsShopOpen(true)}
                  className="hidden sm:flex items-center space-x-1.5 bg-[#53FC18] hover:bg-[#53FC18]/90 text-black text-[11px] font-black px-3 py-1.5 rounded-lg transition-transform hover:scale-105 uppercase tracking-wider shadow-[0_0_10px_rgba(83,252,24,0.3)]"
                  title={t("openShop")}
                >
                  <span>{t("getCoins")}</span>
                </button>
                <div 
                  onClick={() => setIsShopOpen(true)}
                  className="flex items-center space-x-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-3 py-1.5 group cursor-pointer hover:bg-yellow-500/10 hover:border-yellow-500/35 transition-all select-none"
                  title={t("openShop")}
                >
                  <img
                    src="/token.png"
                    alt="Token"
                    className={`h-4 w-4 object-contain rounded-full shadow-[0_0_6px_rgba(255,215,0,0.4)] ${coinAnimate ? "animate-coin-float" : ""}`}
                  />
                  <span className="text-sm font-bold text-yellow-400">{user.tokenBalance.toLocaleString("fr-CA")}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClaim();
                    }}
                    disabled={isClaiming}
                    className="text-[10px] bg-yellow-500/15 hover:bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-md font-bold transition-all disabled:opacity-50 uppercase tracking-wider"
                    title={t("claimTooltip")}
                  >
                    {isClaiming ? "..." : "+500"}
                  </button>
                </div>
              </div>

              {/* Streamer Link */}
              <Link
                href="/dashboard/studio"
                className="hidden sm:flex items-center space-x-1.5 bg-wacke-red/10 hover:bg-wacke-red/20 border border-wacke-red/30
                           text-wacke-red text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-[1.02]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-wacke-red animate-pulse" />
                <span>{t("dashboardStream")}</span>
              </Link>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Cycle Button */}
              <button
                onClick={cycleTheme}
                className="hidden sm:block p-2 rounded-xl hover:bg-white/5 transition-all text-gray-400 hover:text-white"
                title={`${t("themeLabel")} : ${theme.toUpperCase()} (${t("nightMode")})`}
                type="button"
              >
                <Palette className={`w-4 h-4 transition-colors ${
                  theme === "cyber" ? "text-wacke-pink" : theme === "graffiti" ? "text-green-400" : "text-yellow-400"
                }`} />
              </button>

              {/* Language Switch Button */}
              <button
                onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                className="hidden sm:block px-2.5 py-1.5 rounded-xl border border-wacke-purple/10 hover:bg-white/5 transition-all text-xs font-black text-wacke-cyan tracking-wide shrink-0"
                title={language === "fr" ? "Switch to English" : "Passer en Français"}
                type="button"
              >
                🌐 {language.toUpperCase()}
              </button>

              {/* GROK xAI MODES — consolidated popover (Chaos + Fuego) */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setGrokMenuOpen((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all ${grokChaos || grokFuego ? "bg-red-600 text-white border-red-500" : "border-wacke-cyan/30 text-wacke-cyan hover:bg-white/5"}`}
                  title="Grok xAI modes — Chaos & Fuego"
                  type="button"
                >
                  <Bot className="w-3.5 h-3.5" /> GROK
                </button>
                {grokMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setGrokMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-xl p-2 z-50 shadow-2xl animate-scale-in origin-top-right">
                      <button
                        onClick={() => {
                          const next = !grokChaos;
                          setGrokChaos(next);
                          if (next) {
                            document.body.classList.add("grok-takeover", "theme-grok-xai");
                          } else {
                            document.body.classList.remove("grok-takeover", "theme-grok-xai");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${grokChaos ? "bg-red-600/20 text-red-300" : "text-gray-300 hover:bg-white/5"}`}
                      >
                        <span className="flex items-center gap-2"><Bot className="w-3.5 h-3.5" /> Chaos Mode</span>
                        <span className={`w-8 h-4 rounded-full relative transition-colors ${grokChaos ? "bg-red-500" : "bg-white/10"}`}>
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${grokChaos ? "left-4" : "left-0.5"}`} />
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          const next = !grokFuego;
                          setGrokFuego(next);
                          if (next) {
                            document.body.classList.add("grok-fire-mode", "grok-fuego");
                            const fire = document.createElement('div');
                            fire.textContent = '🔥 GROK ON FUEGO 🔥';
                            fire.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-orange-500 z-[99999] pointer-events-none animate-pulse';
                            document.body.appendChild(fire);
                            setTimeout(() => fire.remove(), 2000);
                          } else {
                            document.body.classList.remove("grok-fire-mode", "grok-fuego");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${grokFuego ? "bg-orange-600/20 text-orange-300" : "text-gray-300 hover:bg-white/5"}`}
                      >
                        <span className="flex items-center gap-2">🔥 On Fuego</span>
                        <span className={`w-8 h-4 rounded-full relative transition-colors ${grokFuego ? "bg-orange-500" : "bg-white/10"}`}>
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${grokFuego ? "left-4" : "left-0.5"}`} />
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* User Dropdown */}
              <UserDropdown />
            </>
          ) : (
            !isLoading && (
              <div className="flex items-center space-x-2">
                {/* Language Switch Button (Logged Out) */}
                <button
                  onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                  className="px-2.5 py-1.5 rounded-xl border border-wacke-purple/10 hover:bg-white/5 transition-all text-xs font-black text-wacke-cyan tracking-wide shrink-0"
                  title={language === "fr" ? "Switch to English" : "Passer en Français"}
                  type="button"
                >
                  🌐 {language.toUpperCase()}
                </button>

                <Link
                  href="/auth/login"
                  className="bg-gradient-to-r from-wacke-pink to-wacke-purple text-white text-sm
                             font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02]
                             shadow-lg shadow-wacke-pink/20"
                >
                  {t("login")}
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Token Shop Modal ────────────────────────────────────────────── */}
      <TokenShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />

      {/* ── Gold Coin Shower Overlay ────────────────────────────────────── */}
      {showGoldRain && (
        <>
          <style>{`
            @keyframes coinShower {
              0% {
                transform: translateY(-50px) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(105vh) rotate(720deg);
                opacity: 0;
              }
            }
            .animate-coin-shower {
              animation-name: coinShower;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }
          `}</style>
          <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {[...Array(30)].map((_, i) => {
              const delay = Math.random() * 2;
              const left = Math.random() * 100;
              const size = Math.random() * 20 + 15;
              const rotate = Math.random() * 360;
              return (
                <div
                  key={i}
                  className="absolute text-yellow-400 select-none animate-coin-shower text-xl"
                  style={{
                    left: `${left}%`,
                    top: `-40px`,
                    animationDelay: `${delay}s`,
                    fontSize: `${size}px`,
                    transform: `rotate(${rotate}deg)`,
                    animationDuration: `${Math.random() * 1.5 + 2.5}s`,
                  }}
                >
                  🪙
                </div>
              );
            })}
          </div>
        </>
      )}
    </header>
  );
}
