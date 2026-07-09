"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import KickStreamGrid from "@/components/KickStreamGrid";
import { Gamepad2, Music, Dices, Glasses, Snowflake, Palette, MapPin, Mic } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORIES_META = [
  { slug: "gaming",  icon: <Gamepad2 className="w-6 h-6" />, color: "from-green-600 to-green-800" },
  { slug: "musique", icon: <Music className="w-6 h-6" />,    color: "from-pink-600 to-pink-800" },
  { slug: "jeu",     icon: <Dices className="w-6 h-6" />,    color: "from-purple-600 to-purple-800" },
  { slug: "chile",   icon: <Glasses className="w-6 h-6" />,  color: "from-red-600 to-red-800" },
  { slug: "frette",  icon: <Snowflake className="w-6 h-6" />,color: "from-cyan-600 to-cyan-800" },
  { slug: "art",     icon: <Palette className="w-6 h-6" />,  color: "from-yellow-600 to-yellow-800" },
  { slug: "irl",     icon: <MapPin className="w-6 h-6" />,   color: "from-orange-600 to-orange-800" },
  { slug: "talk",    icon: <Mic className="w-6 h-6" />,      color: "from-indigo-600 to-indigo-800" },
];

// Category slug → translated name key mapping
const CATEGORY_NAME_KEYS: Record<string, string> = {
  gaming: "catGaming",
  musique: "catMusique",
  jeu: "catJeu",
  chile: "catChile",
  frette: "catFrette",
  art: "catArt",
  irl: "catIrl",
  talk: "catTalk",
};

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

function BrowseContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const selectedSlug = searchParams.get("category") ?? undefined;
  const searchQuery  = searchParams.get("search") ?? undefined;

  const CATEGORIES = CATEGORIES_META.map((cat) => ({
    ...cat,
    name: t(CATEGORY_NAME_KEYS[cat.slug] as any),
  }));

  const selectedCategory = CATEGORIES.find((c) => c.slug === selectedSlug);

  // Map our local category slug to a Kick category slug
  const kickCategory = selectedSlug ? CATEGORY_TO_KICK[selectedSlug] : undefined;

  const gridTitle = searchQuery
    ? `🔍 ${t("searchLabel")} : "${searchQuery}"`
    : selectedCategory
    ? `${selectedCategory.name.toUpperCase()} — ${t("livesLabel")}`
    : t("livesDuMoment");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-baseline justify-between border-b border-wacke-purple/15 pb-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 font-display tracking-tight">
            <span className="gradient-text-cyber">
            {searchQuery
              ? `${t("searchLabel")} : "${searchQuery}" 🔍`
              : selectedCategory
              ? `${selectedCategory.name.toUpperCase()}`
              : t("browsePage")}
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            {searchQuery
              ? t("searchResults")
              : selectedCategory
              ? `${t("exploreCategory")} ${selectedCategory.name}`
              : t("exploreWacke")}
          </p>
        </div>
        {(selectedCategory || searchQuery) && (
          <Link
            href="/browse"
            className="text-sm font-bold text-wacke-cyan hover:text-white border border-wacke-cyan/30 hover:border-wacke-cyan/60 px-4 py-2 rounded-xl transition-all hover:scale-105"
          >
            {t("allCategories")}
          </Link>
        )}
      </div>

      {/* ── Category Grid ─────────────────────────────────────────────── */}
      {!selectedCategory && !searchQuery && (
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-5 text-gray-300">{t("categories")}</h2>
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

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/5 rounded-xl w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-2xl" />)}
          </div>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
