import { notFound } from "next/navigation";
export const dynamic = 'force-dynamic';

import { db, getStreamByUserId, getRecentMessages, getUserByUsername } from "@wacke/db";
import WackePlayer from "@/components/WackePlayer";
import GraffitiChat from "@/components/GraffitiChat";
import { getMuxThumbnailUrl } from "@/lib/mux";
import type { Metadata } from "next";

interface StreamPageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: StreamPageProps): Promise<Metadata> {
  const user = await getUserByUsername(params.username);
  if (!user) return { title: "Stream introuvable — Wacké" };

  const stream = await getStreamByUserId(user.id);
  return {
    title: stream ? `${stream.title} — ${user.displayName} | Wacké` : `${user.displayName} | Wacké`,
    description: stream?.description ?? `Regarde ${user.displayName} sur Wacké`,
    openGraph: {
      images: stream?.muxPlaybackId
        ? [getMuxThumbnailUrl(stream.muxPlaybackId)]
        : [],
    },
  };
}

export default async function StreamPage({ params }: StreamPageProps) {
  const user = await getUserByUsername(params.username);
  if (!user) notFound();

  const stream = await getStreamByUserId(user.id);
  if (!stream) notFound();

  // Hydrate chat with last 50 messages (SSR for instant load)
  const initialMessages = stream.status === "live"
    ? await getRecentMessages(stream.id, 50)
    : [];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── Main Stream Area ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {stream.muxPlaybackId ? (
          <WackePlayer
            playbackId={stream.muxPlaybackId}
            title={stream.title}
            streamerName={user.displayName}
            viewerCount={stream.viewerCount}
            isLive={stream.status === "live"}
          />
        ) : (
          <div className="aspect-video bg-wacke-darker rounded-xl flex items-center justify-center neon-border">
            <div className="text-center">
              <p className="text-5xl mb-4">📡</p>
              <p className="text-wacke-pink font-bold text-xl">Stream hors ligne</p>
              <p className="text-gray-400 mt-2">
                {user.displayName} n&apos;est pas en live pour l&apos;instant
              </p>
            </div>
          </div>
        )}

        {/* ── Stream Info ───────────────────────────────────────────────── */}
        <div className="bg-wacke-darker rounded-xl p-6 border border-wacke-purple/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-2xl font-bold">
                {user.displayName[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{stream.title}</h1>
                <p className="text-wacke-cyan font-semibold">{user.displayName}</p>
                <p className="text-gray-400 text-sm capitalize mt-1">{stream.category}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button className="bg-wacke-pink/20 hover:bg-wacke-pink/40 border border-wacke-pink/40 px-5 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105">
                <span>🔥</span>
                <span>BOUM!</span>
              </button>
              <button className="bg-wacke-purple/20 hover:bg-wacke-purple/40 border border-wacke-purple/40 px-5 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105">
                <span>💜</span>
                <span>SUIVRE</span>
              </button>
            </div>
          </div>

          {stream.description && (
            <p className="text-gray-300 mt-4 text-sm leading-relaxed">{stream.description}</p>
          )}
        </div>
      </main>

      {/* ── Graffiti Chat ─────────────────────────────────────────────────── */}
      <GraffitiChat
        streamId={stream.id}
        initialMessages={initialMessages as any}
      />
    </div>
  );
}
