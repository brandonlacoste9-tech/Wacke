import Link from "next/link";
import KickStreamGrid from "@/components/KickStreamGrid";

export const dynamic = "force-dynamic";

interface BrowsePageProps {
  searchParams: { category?: string; search?: string };
}

const CATEGORIES = [
  { slug: "gaming",  name: "Gaming",  color: "from-green-600 to-green-800",  icon: "🎮" },
  { slug: "musique", name: "Musique", color: "from-pink-600 to-pink-800",    icon: "🎵" },
  { slug: "jeu",     name: "Jeu",     color: "from-purple-600 to-purple-800", icon: "🎲" },
  { slug: "chile",   name: "Chilé",   color: "from-red-600 to-red-800",      icon: "😎" },
  { slug: "frette",  name: "Frette",  color: "from-cyan-600 to-cyan-800",    icon: "❄️" },
  { slug: "art",     name: "Art",     color: "from-yellow-600 to-yellow-800", icon: "🎨" },
  { slug: "irl",     name: "IRL",     color: "from-orange-600 to-orange-800", icon: "📍" },
  { slug: "talk",    name: "Talk",    color: "from-indigo-600 to-indigo-800", icon: "🎤" },
];

// Category slug → Kick category slug mapping
const CATEGORY_TO_KICK: Record<string, string> = {
  gaming:  "Gaming",
  musique: "Music",
  jeu:     "Just Chatting",
  chile:   "Just Chatting",
  frette:  "Just Chatting",
  art:     "Art",
  irl:     "IRL",
  talk:    "Just Chatting",
};

export default function BrowsePage({ searchParams }: BrowsePageProps) {
  const selectedSlug = searchParams.category;
  const searchQuery  = searchParams.search;
  const selectedCategory = CATEGORIES.find((c) => c.slug === selectedSlug);

  // Map our local category slug to a Kick category slug
  const kickCategory = selectedSlug ? CATEGORY_TO_KICK[selectedSlug] : undefined;

  const gridTitle = searchQuery
    ? `🔍 RECHERCHE : "${searchQuery}"`
    : selectedCategory
    ? `${selectedCategory.icon} LIVES ${selectedCategory.name.toUpperCase()}`
    : "🔴 LIVES DU MOMENT";

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-wacke-dark">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-baseline justify-between border-b border-wacke-purple/20 pb-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 neon-pink graffiti-text">
            {searchQuery
              ? `RECHERCHE : "${searchQuery}" 🔍`
              : selectedCategory
              ? `PARCOURIR : ${selectedCategory.name.toUpperCase()} ${selectedCategory.icon}`
              : "PARCOURIR"}
          </h1>
          <p className="text-gray-400 text-sm">
            {searchQuery
              ? "Résultats de recherche pour les streams en direct"
              : selectedCategory
              ? `Explore les streams de la catégorie ${selectedCategory.name}`
              : "Explore les streams les plus wackés du moment"}
          </p>
        </div>
        {(selectedCategory || searchQuery) && (
          <Link
            href="/browse"
            className="text-sm font-bold text-wacke-cyan hover:underline border border-wacke-cyan/30 px-4 py-2 rounded-xl transition-all"
          >
            ← Toutes les catégories
          </Link>
        )}
      </div>

      {/* ── Category Grid ─────────────────────────────────────────────── */}
      {!selectedCategory && !searchQuery && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-gray-300">Catégories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/browse?category=${category.slug}`}
                className={`bg-gradient-to-br ${category.color} p-4 rounded-xl cursor-pointer hover:scale-105
                           transition-transform text-center border border-white/5 overflow-hidden`}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="text-sm font-bold truncate text-white">{category.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Streams Grid (real Kick data) ──────────────────────────── */}
      <KickStreamGrid
        limit={40}
        category={kickCategory}
        title={gridTitle}
        columns={4}
      />
    </div>
  );
}
