import { getLiveStreams } from "@wacke/db";
import { StreamCard } from "@wacke/ui";
import Link from "next/link";
import FeaturedCarousel from "@/components/FeaturedCarousel";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const liveStreams = await getLiveStreams(12);

  return (
    <main className="min-h-screen bg-wacke-dark">
      {/* ── Featured Video Carousel ────────────────────────────────────────── */}
      <section className="px-8 pt-8 pb-4 max-w-7xl mx-auto">
        <FeaturedCarousel streams={liveStreams} />
      </section>

      {/* ── Live Streams Grid ─────────────────────────────────────────────── */}
      <section className="px-8 pb-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            🔴 <span className="neon-pink graffiti-text">LIVE MAINTENANT</span>
          </h2>
          <Link href="/browse" className="text-sm text-wacke-cyan hover:underline">
            Voir tout →
          </Link>
        </div>

        {liveStreams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">😴</p>
            <p className="text-gray-400 text-lg">Personne en live pour l&apos;instant...</p>
            <p className="text-gray-600 text-sm mt-2">Sois le premier à streamer aujourd&apos;hui!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {liveStreams
              .filter((stream) => stream.user?.username)
              .map((stream) => (
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

      {/* ── Category Teasers ──────────────────────────────────────────────── */}
      <section className="px-8 pb-16 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
          🎨 <span className="neon-cyan graffiti-text">PARCOURIR PAR CATÉGORIE</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Gaming", icon: "🎮", slug: "gaming" },
            { name: "Musique", icon: "🎵", slug: "musique" },
            { name: "Jeu", icon: "🎲", slug: "jeu" },
            { name: "Chilé", icon: "😎", slug: "chile" },
            { name: "Frette", icon: "❄️", slug: "frette" },
            { name: "Art", icon: "🎨", slug: "art" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="bg-wacke-darker border border-wacke-purple/20 rounded-xl p-4 text-center
                         hover:border-wacke-pink/40 hover:bg-wacke-purple/10 transition-all hover:scale-105"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="text-sm font-bold">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
