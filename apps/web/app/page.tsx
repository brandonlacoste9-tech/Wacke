import { getLiveStreams } from "@wacke/db";
import { StreamCard } from "@wacke/ui";
import Link from "next/link";

// Revalidate every 30 seconds for near-real-time stream grid
export const revalidate = 30;

export default async function HomePage() {
  const liveStreams = await getLiveStreams(12);

  return (
    <main className="min-h-screen bg-wacke-dark">
      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <section className="relative px-8 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-wacke-purple/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-wacke-pink/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-7xl font-bold graffiti-text neon-pink mb-4">WACKÉ</h1>
          <p className="text-xl text-gray-300 max-w-xl mx-auto mb-2">
            Le streaming <span className="text-wacke-cyan font-bold">québécois</span>. Raw, wacké, 100% culture de rue.
          </p>
          <p className="text-sm text-gray-500 mb-8">Kick meets dépanneur drama. 🏪🔥</p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/browse"
              className="bg-gradient-to-r from-wacke-pink to-wacke-purple px-8 py-3 rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105"
            >
              Parcourir les streams
            </Link>
            <Link
              href="/dashboard/stream"
              className="border border-wacke-cyan/40 text-wacke-cyan px-8 py-3 rounded-xl font-bold text-lg hover:bg-wacke-cyan/10 transition-all hover:scale-105"
            >
              Commencer à streamer
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Streams Grid ─────────────────────────────────────────────── */}
      <section className="px-8 pb-16">
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

      {/* ── Category Teasers ──────────────────────────────────────────────── */}
      <section className="px-8 pb-16">
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
