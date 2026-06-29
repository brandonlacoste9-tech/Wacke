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
            { name: "Gaming",  icon: "🎮", slug: "gaming",  from: "from-green-700",  to: "to-green-900"  },
            { name: "Musique", icon: "🎵", slug: "musique", from: "from-pink-700",   to: "to-pink-900"   },
            { name: "Jeu",     icon: "🎲", slug: "jeu",     from: "from-purple-700", to: "to-purple-900" },
            { name: "Chilé",   icon: "😎", slug: "chile",   from: "from-red-700",    to: "to-red-900"    },
            { name: "Frette",  icon: "❄️", slug: "frette",  from: "from-cyan-700",   to: "to-cyan-900"   },
            { name: "Art",     icon: "🎨", slug: "art",     from: "from-yellow-700", to: "to-yellow-900" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className={`bg-gradient-to-br ${cat.from} ${cat.to} border border-white/5 rounded-xl p-4
                         text-center hover:scale-105 hover:border-white/20 transition-all duration-200 shadow-md`}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="text-sm font-bold text-white">{cat.name}</p>
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
