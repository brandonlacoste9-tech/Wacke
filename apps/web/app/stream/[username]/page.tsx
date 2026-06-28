import { notFound } from "next/navigation";
import { cookies } from "next/headers";
export const dynamic = 'force-dynamic';

import { db, getStreamByUserId, getRecentMessages, getUserByUsername, isFollowing, users } from "@wacke/db";
import { eq } from "drizzle-orm";
import WackePlayer from "@/components/WackePlayer";
import GraffitiChat from "@/components/GraffitiChat";
import TokenBar from "@/components/TokenBar";
import FollowButton from "@/components/FollowButton";
import ReactionButton from "@/components/ReactionButton";
import { getMuxThumbnailUrl } from "@/lib/mux";
import { getSupabaseAdmin } from "@/lib/supabase/server";
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

  // Read auth token from cookie and fetch database viewer info
  const cookieStore = cookies();
  const token = cookieStore.get("wacke_token")?.value;
  let viewer = null;
  let initialIsFollowing = false;

  if (token) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      if (authUser) {
        viewer = await db.query.users.findFirst({
          where: eq(users.supabaseId, authUser.id),
        });
        if (viewer) {
          initialIsFollowing = await isFollowing(viewer.id, user.id);
        }
      }
    } catch (err) {
      console.error("[STREAM_PAGE_AUTH_ERROR]", err);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
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

            {/* Action buttons (client components) */}
            <div className="flex items-center space-x-3">
              <ReactionButton
                streamerId={user.id}
                streamId={stream.id}
                authToken={token}
              />
              <FollowButton
                streamerId={user.id}
                initialIsFollowing={initialIsFollowing}
                authToken={token}
              />
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
        currentUserId={viewer?.id}
      />

      {/* ── Floating Token Bar ────────────────────────────────────────────── */}
      <TokenBar
        initialBalance={viewer?.tokenBalance ?? 0}
        streamerId={user.id}
        streamId={stream.id}
        authToken={token}
      />
    </div>
  );
}

