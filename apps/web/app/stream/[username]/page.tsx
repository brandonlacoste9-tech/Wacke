import { notFound } from "next/navigation";
import { cookies } from "next/headers";
export const dynamic = 'force-dynamic';

import { getStreamByUserId, getRecentMessages, getUserByUsername, isFollowing, getUserBySupabaseId, TOP_KICK_STREAMERS } from "@wacke/db";
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
  const cleanUsername = params.username.toLowerCase();
  if (cleanUsername.startsWith("twitch-")) {
    const twitchUsername = cleanUsername.substring(7);
    const displayName = twitchUsername.charAt(0).toUpperCase() + twitchUsername.slice(1);
    return {
      title: `🔴 Live de ${displayName} | Wacké`,
      description: `Regarde ${displayName} diffuser en direct sur Wacké via Twitch!`,
    };
  }

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
  const cleanUsername = params.username.toLowerCase();
  const isTwitchStream = cleanUsername.startsWith("twitch-");

  if (isTwitchStream) {
    const twitchUsername = cleanUsername.substring(7); // Remove "twitch-" prefix
    const displayName = twitchUsername.charAt(0).toUpperCase() + twitchUsername.slice(1);
    const fallbackTitle = `🔴 Diffusion en direct de Twitch.tv`;

    return (
      <div className="flex h-[calc(100vh-64px)] relative">
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <WackePlayer
            playbackId="mock_playback_id"
            title={fallbackTitle}
            streamerName={displayName}
            viewerCount={15400}
            isLive={true}
            twitchUsername={twitchUsername}
          />
          <div className="bg-wacke-darker rounded-xl p-6 border border-wacke-purple/20">
            <h1 className="text-2xl font-bold text-white">{fallbackTitle}</h1>
            <p className="text-wacke-cyan font-semibold capitalize">{twitchUsername}</p>
          </div>
        </main>
        <GraffitiChat
          streamId={`twitch-mock-chat-${twitchUsername}`}
          initialMessages={[]}
          currentUserId={undefined}
        />
        <TokenBar
          initialBalance={500}
          streamerId={`twitch-mock-streamer-${twitchUsername}`}
          streamId={`twitch-mock-chat-${twitchUsername}`}
          authToken={undefined}
        />
      </div>
    );
  }

  let user;
  let stream;
  let initialMessages: any[] = [];
  let viewer = null;
  let initialIsFollowing = false;
  let token = null;

  try {
    user = await getUserByUsername(params.username);
    if (!user) notFound();

    stream = await getStreamByUserId(user.id);
    if (!stream) notFound();

    // Hydrate chat with last 50 messages (SSR for instant load)
    initialMessages = stream.status === "live"
      ? await getRecentMessages(stream.id, 50)
      : [];

    // Read auth token from cookie and fetch database viewer info
    const cookieStore = cookies();
    token = cookieStore.get("wacke_token")?.value;

    if (token) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        if (authUser) {
          viewer = await getUserBySupabaseId(authUser.id);
          if (viewer) {
            initialIsFollowing = await isFollowing(viewer.id, user.id);
          }
        }
      } catch (err) {
        console.error("[STREAM_PAGE_AUTH_ERROR]", err);
      }
    }
  } catch (dbErr) {
    console.error("[STREAM_PAGE_DB_FAIL_FALLBACK]", dbErr);
    // Graceful database fallback: render the Kick live player directly using path params
    const cleanUsername = params.username.toLowerCase();
    const fallbackTitle = `🔴 Diffusion en direct de Kick.com`;
    
    return (
      <div className="flex h-[calc(100vh-64px)] relative">
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <WackePlayer
            playbackId="mock_playback_id"
            title={fallbackTitle}
            streamerName={cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1)}
            viewerCount={12400}
            isLive={true}
            kickUsername={cleanUsername}
          />
          <div className="bg-wacke-darker rounded-xl p-6 border border-wacke-purple/20">
            <h1 className="text-2xl font-bold text-white">{fallbackTitle}</h1>
            <p className="text-wacke-cyan font-semibold capitalize">{cleanUsername}</p>
          </div>
        </main>
        <GraffitiChat
          streamId={`kick-mock-chat-${cleanUsername}`}
          initialMessages={[]}
          currentUserId={undefined}
        />
        <TokenBar
          initialBalance={500}
          streamerId={`kick-mock-streamer-${cleanUsername}`}
          streamId={`kick-mock-chat-${cleanUsername}`}
          authToken={undefined}
        />
      </div>
    );
  }

  const isKickUser =
    user.supabaseId?.startsWith("kick-") ||
    user.username.startsWith("kickseur_") ||
    TOP_KICK_STREAMERS.includes(user.username.toLowerCase());


  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* ── Main Stream Area ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {isKickUser || (stream.status === "live" && stream.muxPlaybackId) ? (
          <WackePlayer
            playbackId={stream.muxPlaybackId ?? "mock_playback_id"}
            title={stream.title}
            streamerName={user.displayName}
            viewerCount={stream.viewerCount}
            isLive={stream.status === "live"}
            kickUsername={isKickUser ? user.username : undefined}
          />
        ) : (
          <div
            className="aspect-video rounded-xl flex items-center justify-center neon-border relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `url('/generated_wacke_banner.png')` }}
          >
            {/* Dark glass overlay */}
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[5px] z-0" />

            {/* Content */}
            <div className="text-center relative z-10 p-6 bg-wacke-darker/70 rounded-2xl border border-wacke-purple/30 backdrop-blur-md shadow-2xl max-w-sm">
              <p className="text-5xl mb-3 animate-pulse">📡</p>
              <p className="text-wacke-pink font-black text-xl tracking-tight uppercase">Stream hors ligne</p>
              <p className="text-gray-300 text-sm mt-2 font-medium">
                {user.displayName} n&apos;est pas en live pour l&apos;instant
              </p>
              <div className="mt-4 flex items-center justify-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span>🔴 Reviens plus tard pour le live</span>
              </div>
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

