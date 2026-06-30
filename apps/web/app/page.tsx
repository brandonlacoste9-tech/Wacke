import Link from "next/link";
import KickFeaturedCarousel from "@/components/KickFeaturedCarousel";
import CombinedStreamGrid from "@/components/CombinedStreamGrid";
import TrendingGames from "@/components/TrendingGames";

// Always server-render — never statically cache this page
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-wacke-dark">
      {/* ── Featured Carousel (real-time Kick streams) ──────────────────── */}
      <section className="px-8 pt-8 pb-4 max-w-7xl mx-auto">
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
        <h2 className="text-2xl font-bold mb-6">
          🎨 <span className="neon-cyan graffiti-text">PARCOURIR PAR CATÉGORIE</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Gaming",  icon: "🎮", slug: "gaming" },
            { name: "Musique", icon: "🎵", slug: "musique" },
            { name: "Jeu",     icon: "🎲", slug: "jeu" },
            { name: "Chilé",   icon: "😎", slug: "chile" },
            { name: "Frette",  icon: "❄️", slug: "frette" },
            { name: "Art",     icon: "🎨", slug: "art" },
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
