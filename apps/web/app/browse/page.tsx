import { getLiveStreams } from "@wacke/db";
import { StreamCard } from "@wacke/ui";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface BrowsePageProps {
  searchParams: { category?: string };
}

const CATEGORIES = [
  { slug: "gaming", name: "Gaming", color: "from-green-600 to-green-800", icon: "🎮" },
  { slug: "musique", name: "Musique", color: "from-pink-600 to-pink-800", icon: "🎵" },
  { slug: "jeu", name: "Jeu", color: "from-purple-600 to-purple-800", icon: "🎲" },
  { slug: "chile", name: "Chilé", color: "from-red-600 to-red-800", icon: "😎" },
  { slug: "frette", name: "Frette", color: "from-cyan-600 to-cyan-800", icon: "❄️" },
  { slug: "art", name: "Art", color: "from-yellow-600 to-yellow-800", icon: "🎨" },
  { slug: "irl", name: "IRL", color: "from-orange-600 to-orange-800", icon: "📍" },
  { slug: "talk", name: "Talk", color: "from-indigo-600 to-indigo-800", icon: "🎤" },
];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const selectedSlug = searchParams.category;
  const selectedCategory = CATEGORIES.find((c) => c.slug === selectedSlug);

  // Fetch streams matching category filter if any
  const liveStreams = await getLiveStreams(40, selectedSlug);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-wacke-dark">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-baseline justify-between border-b border-wacke-purple/20 pb-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 neon-pink graffiti-text">
            {selectedCategory ? `PARCOURIR : ${selectedCategory.name.toUpperCase()} ${selectedCategory.icon}` : "PARCOURIR"}
          </h1>
          <p className="text-gray-400 text-sm">
            {selectedCategory
              ? `Explore les streams de la catégorie ${selectedCategory.name}`
              : "Explore les streams les plus wackés du Québec"}
          </p>
        </div>
        {selectedCategory && (
          <Link
            href="/browse"
            className="text-sm font-bold text-wacke-cyan hover:underline border border-wacke-cyan/30 px-4 py-2 rounded-xl transition-all"
          >
            ← Toutes les catégories
          </Link>
        )}
      </div>

      {/* ── Categories Grid ─────────────────────────────────────────────── */}
      {!selectedCategory && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-gray-300">Catégories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/browse?category=${category.slug}`}
                className={`bg-gradient-to-br ${category.color} p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform text-center relative border border-white/5 overflow-hidden`}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="text-sm font-bold truncate text-white">{category.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Streams Display ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <span>🔴</span>
          <span className="graffiti-text neon-cyan">
            {selectedCategory ? `LIVES ${selectedCategory.name.toUpperCase()}` : "LIVES DU MOMENT"}
          </span>
        </h2>

        {liveStreams.length === 0 ? (
          <div className="text-center py-24 bg-wacke-darker/40 border border-wacke-purple/20 rounded-2xl">
            <p className="text-5xl mb-4">😴</p>
            <p className="text-gray-400 text-lg font-bold">Aucun stream en direct</p>
            <p className="text-gray-600 text-sm mt-2">
              {selectedCategory
                ? `Personne ne diffuse dans ${selectedCategory.name} pour le moment.`
                : "Reviens plus tard ou commence à streamer toi-même!"}
            </p>
            {selectedCategory && (
              <Link
                href="/browse"
                className="mt-6 inline-block bg-gradient-to-r from-wacke-pink to-wacke-purple px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
              >
                Voir d&apos;autres catégories
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {liveStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                playbackId={stream.muxPlaybackId ?? undefined}
                title={stream.title}
                streamerName={stream.user?.displayName ?? stream.user?.username ?? "Streamer"}
                viewerCount={stream.viewerCount}
                category={stream.category}
                href={`/stream/${stream.user?.username}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
