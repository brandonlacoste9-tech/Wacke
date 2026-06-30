import Link from "next/link";
import KickFeaturedCarousel from "@/components/KickFeaturedCarousel";
import CombinedStreamGrid from "@/components/CombinedStreamGrid";
import TrendingGames from "@/components/TrendingGames";
import { Gamepad2, Music, Dices, Glasses, Snowflake, Palette } from "lucide-react";

// Always server-render — never statically cache this page
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-wacke-dark">
      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <section className="relative w-full h-[30vh] min-h-[300px] mb-8 overflow-hidden flex items-center justify-center border-b border-wacke-purple/30">
        <img src="/hero_banner.jpg" alt="Cyberpunk City" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-wacke-dark via-wacke-dark/40 to-transparent z-10" />
        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black graffiti-text neon-pink mb-4 tracking-wider uppercase drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]">Bienvenue sur Wacké</h1>
          <p className="text-lg md:text-xl text-gray-200 font-bold max-w-2xl mx-auto drop-shadow-md">Le hub du streaming québécois. Sans filtre. 100% pur jus.</p>
        </div>
      </section>

      {/* ── Featured Carousel (real-time Kick streams) ──────────────────── */}
      <section className="px-8 pt-4 pb-4 max-w-7xl mx-auto">
        <KickFeaturedCarousel />
      </section>

      {/* ── Live Streams Grid (Kick + Twitch) ─────────────────────────── */}
      <section className="px-8 pb-16 max-w-7xl mx-auto">
        <CombinedStreamGrid
          limit={20}
          title="🔴 LIVE MAINTENANT"
        />
      </section>

      {/* ── Category Quick Links ───────────────────────────────────────── */}
      <section className="px-8 pb-16 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Palette className="w-6 h-6 text-wacke-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
          <span className="neon-cyan graffiti-text">PARCOURIR PAR CATÉGORIE</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Gaming",  icon: <Gamepad2 className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />, slug: "gaming" },
            { name: "Musique", icon: <Music className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />, slug: "musique" },
            { name: "Jeu",     icon: <Dices className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />, slug: "jeu" },
            { name: "Chilé",   icon: <Glasses className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />, slug: "chile" },
            { name: "Frette",  icon: <Snowflake className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />, slug: "frette" },
            { name: "Art",     icon: <Palette className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />, slug: "art" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="relative aspect-square border border-wacke-purple/20 rounded-xl overflow-hidden
                         hover:scale-105 hover:border-wacke-cyan/40 transition-all duration-200 shadow-xl group"
            >
              {/* Background cover image */}
              <img
                src={`/categories/${cat.slug}.png`}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 z-0"
              />
              {/* Glass overlay */}
              <div className="absolute inset-0 bg-black/55 group-hover:bg-black/40 transition-colors z-10" />

              {/* Text / Icon content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
                <div className="text-3xl mb-1.5 drop-shadow-md">{cat.icon}</div>
                <p className="text-sm font-black text-white uppercase tracking-tight drop-shadow-md">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12">
          <TrendingGames />
        </div>
      </section>
    </main>
  );
}
