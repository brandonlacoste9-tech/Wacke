"use client";

import Link from "next/link";
import KickFeaturedCarousel from "@/components/KickFeaturedCarousel";
import CombinedStreamGrid from "@/components/CombinedStreamGrid";
import TrendingGames from "@/components/TrendingGames";
import ParticleBackground from "@/components/ParticleBackground";
import GrokFire from "@/components/GrokFire";
import GrokBuildInstall from "@/components/GrokBuildInstall";
import { useLanguage } from "@/components/LanguageProvider";
import { Gamepad2, Music, Dices, Glasses, Snowflake, Palette, TrendingUp, Users, Zap } from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();

  const categories = [
    { name: t("catGaming"),  icon: <Gamepad2 className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />, slug: "gaming" },
    { name: t("catMusique"), icon: <Music className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />, slug: "musique" },
    { name: t("catJeu"),     icon: <Dices className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />, slug: "jeu" },
    { name: t("catChile"),   icon: <Glasses className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />, slug: "chile" },
    { name: t("catFrette"),  icon: <Snowflake className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />, slug: "frette" },
    { name: t("catArt"),     icon: <Palette className="w-7 h-7 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />, slug: "art" },
  ];

  return (
    <main className="min-h-screen bg-wacke-dark">
      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <section className="relative w-full h-auto min-h-[420px] md:h-[40vh] py-12 mb-4 overflow-hidden flex items-center justify-center border-b border-wacke-purple/20">
        <img src="/hero_banner.jpg" alt="Cyberpunk City" className="absolute inset-0 w-full h-full object-cover z-0 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-wacke-dark via-wacke-dark/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-wacke-dark/30 via-transparent to-wacke-dark/30 z-10" />
        <ParticleBackground count={25} />

        <div className="relative z-20 text-center px-4 mt-16 flex flex-col items-center">
          <div className="relative w-full max-w-[650px] aspect-[21/9] mb-4 mx-auto drop-shadow-[0_0_24px_rgba(255,42,133,0.45)]">
            <img 
              src="/graffiti-logo.png" 
              alt="WACKE Graffiti Logo" 
              className="w-full h-full object-cover"
              style={{ 
                maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)', 
                WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)' 
              }} 
            />
          </div>
          <h1 className="sr-only">WACKE</h1>
          <p className="text-base md:text-lg text-gray-200 font-medium max-w-xl mx-auto drop-shadow-md mb-6">
            {t("heroSubtitle")} <span className="text-wacke-cyan font-bold">+ Grok chaos</span>
          </p>
          <div className="text-[10px] uppercase tracking-[3px] text-wacke-cyan/70 mb-2">POWERED BY GROK xAI • Maximum Truth • Maximum Wacké</div>

          {/* LIGHT THE MATCH BOOM - GROK xAI ON FIRE */}
          <div className="mb-8">
            <GrokFire />
          </div>

          {/* Animated Stats */}
          <div className="flex items-center justify-center space-x-6 md:space-x-10">
            <div className="flex items-center space-x-2 glass rounded-xl px-4 py-2">
              <Users className="w-4 h-4 text-wacke-pink" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">142K+</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t("spectators")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 glass rounded-xl px-4 py-2">
              <TrendingUp className="w-4 h-4 text-wacke-cyan" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">500+</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t("channels")}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 glass rounded-xl px-4 py-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">2M+</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t("boom")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Carousel (real-time Kick streams) ──────────────────── */}
      <section className="px-6 lg:px-8 pt-4 pb-4 max-w-7xl mx-auto">
        <KickFeaturedCarousel />
      </section>

      {/* ── Live Streams Grid (Kick + Twitch) ─────────────────────────── */}
      <section className="px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
        <CombinedStreamGrid
          limit={20}
        />
      </section>

      {/* ── Category Quick Links ───────────────────────────────────────── */}
      <section className="px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Palette className="w-6 h-6 text-wacke-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.6)]" />
          <span className="font-display tracking-tight text-white">{t("browseByCategory")}</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="relative aspect-square border border-wacke-purple/15 rounded-2xl overflow-hidden
                         hover:scale-105 hover:border-wacke-cyan/30 transition-all duration-300 shadow-xl group card-glow"
            >
              {/* Background cover image */}
              <img
                src={`/categories/${cat.slug}.png`}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 z-0"
              />
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-black/65 group-hover:bg-black/45 transition-colors duration-300 z-10 backdrop-blur-[1px]" />

              {/* Text / Icon content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{cat.icon}</div>
                <p className="text-sm font-black text-white uppercase tracking-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <TrendingGames />
        </div>
      </section>

      {/* ── Grok Build — CLI install banner ─────────────────────────────── */}
      <GrokBuildInstall />
    </main>
  );
}
