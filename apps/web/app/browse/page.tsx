import Link from "next/link";
import KickStreamGrid from "@/components/KickStreamGrid";
import { Gamepad2, Music, Dices, Glasses, Snowflake, Palette, MapPin, Mic } from "lucide-react";

export const dynamic = "force-dynamic";

interface BrowsePageProps {
  searchParams: { category?: string; search?: string };
}

const CATEGORIES = [
  { slug: "gaming",  name: "Gaming",  icon: <Gamepad2 className="w-6 h-6" />, color: "from-green-600 to-green-800" },
  { slug: "musique", name: "Musique", icon: <Music className="w-6 h-6" />,    color: "from-pink-600 to-pink-800" },
  { slug: "jeu",     name: "Jeu",     icon: <Dices className="w-6 h-6" />,    color: "from-purple-600 to-purple-800" },
  { slug: "chile",   name: "Chilé",   icon: <Glasses className="w-6 h-6" />,  color: "from-red-600 to-red-800" },
  { slug: "frette",  name: "Frette",  icon: <Snowflake className="w-6 h-6" />,color: "from-cyan-600 to-cyan-800" },
  { slug: "art",     name: "Art",     icon: <Palette className="w-6 h-6" />,  color: "from-yellow-600 to-yellow-800" },
  { slug: "irl",     name: "IRL",     icon: <MapPin className="w-6 h-6" />,   color: "from-orange-600 to-orange-800" },
  { slug: "talk",    name: "Talk",    icon: <Mic className="w-6 h-6" />,      color: "from-indigo-600 to-indigo-800" },
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
    ? `${selectedCategory.name.toUpperCase()} — LIVES`
    : "🔴 LIVES DU MOMENT";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-baseline justify-between border-b border-wacke-purple/15 pb-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 graffiti-text neon-pink">
            {searchQuery
              ? `RECHERCHE : "${searchQuery}" 🔍`
              : selectedCategory
              ? `${selectedCategory.name.toUpperCase()}`
              : "PARCOURIR"}
          </h1>
          <p className="text-gray-500 text-sm">
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
            className="text-sm font-bold text-wacke-cyan hover:text-white border border-wacke-cyan/30 hover:border-wacke-cyan/60 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            ← Toutes les catégories
          </Link>
        )}
      </div>

      {/* ── Category Grid ─────────────────────────────────────────────── */}
      {!selectedCategory && !searchQuery && (
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-5 text-gray-300">Catégories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 stagger-children">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/browse?category=${category.slug}`}
                className={`bg-gradient-to-br ${category.color} p-4 rounded-2xl cursor-pointer
                           hover:scale-105 hover:shadow-xl transition-all duration-300 text-center
                           border border-white/5 overflow-hidden group card-glow`}
              >
                <div className="mb-2 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="text-xs font-bold truncate text-white">{category.name}</h3>
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
