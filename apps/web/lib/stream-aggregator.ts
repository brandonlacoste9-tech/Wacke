import { getKickLivestreams } from "@/lib/kick-api";
import { getTwitchLivestreams, getTwitchUsers, resolveTwitchThumbnail } from "@/lib/twitch-api";
import { getLiveStreams } from "@wacke/db";

export interface UnifiedStream {
  id: string;
  source: "kick" | "twitch" | "wacké";
  username: string;
  displayName: string;
  title: string;
  category: string;
  viewerCount: number;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  isLive: boolean;
  isFallback?: boolean;
  language?: string;
}

function formatDisplayName(username: string): string {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function mapKickStream(s: Record<string, unknown>, isFallback: boolean): UnifiedStream {
  const channel = s.channel as Record<string, unknown> | undefined;
  const channelUser = channel?.user as Record<string, unknown> | undefined;
  const categories = s.categories as Array<{ name?: string }> | undefined;
  const categoryObj = s.category as { name?: string } | undefined;

  const username = String(channelUser?.username ?? s.slug ?? "user");
  const thumb = s.thumbnail;
  const thumbnailUrl =
    typeof thumb === "string" ? thumb : (thumb as { src?: string } | undefined)?.src ?? null;

  return {
    id: `kick-${String(s.id ?? username)}`,
    source: "kick",
    username,
    displayName: formatDisplayName(username),
    title: String(s.stream_title ?? s.session_title ?? "Live Stream"),
    category: String(categoryObj?.name ?? categories?.[0]?.name ?? "Live"),
    viewerCount: Number(s.viewer_count ?? 0),
    thumbnailUrl,
    avatarUrl: String(
      s.profile_picture ?? channel?.profile_picture ?? channelUser?.profile_pic ?? ""
    ) || null,
    isLive: !isFallback,
    isFallback,
    language: String(s.language ?? ""),
  };
}

export async function fetchKickStreams(limit: number): Promise<UnifiedStream[]> {
  try {
    const streams = await getKickLivestreams(limit);
    if (streams.length > 0) {
      return streams.map((s) => mapKickStream(s as unknown as Record<string, unknown>, false));
    }
  } catch (err) {
    console.error("[stream-aggregator] Kick fetch failed:", err);
  }
  return [];
}

export async function fetchTwitchStreams(limit: number): Promise<UnifiedStream[]> {
  try {
    const streams = await getTwitchLivestreams(limit);
    if (streams.length === 0) return [];

    const logins = streams.map((s) => s.user_login);
    const users = await getTwitchUsers(logins);
    const userMap = Object.fromEntries(users.map((u) => [u.login, u]));

    return streams.map((s) => ({
      id: `twitch-${s.id}`,
      source: "twitch" as const,
      username: s.user_login,
      displayName: s.user_name,
      title: s.title ?? "Live Stream",
      category: s.game_name ?? "Live",
      viewerCount: s.viewer_count ?? 0,
      thumbnailUrl: resolveTwitchThumbnail(s.thumbnail_url, 640, 360),
      avatarUrl: userMap[s.user_login]?.profile_image_url ?? null,
      isLive: true,
      language: s.language ?? "",
    }));
  } catch (err) {
    console.error("[stream-aggregator] Twitch fetch failed:", err);
    return [];
  }
}

export async function fetchWackeStreams(limit: number): Promise<UnifiedStream[]> {
  try {
    const cfAcct = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID ?? "";
    const liveStreams = await getLiveStreams(limit);

    return liveStreams
      .filter((s: { id?: string; user?: { username?: string; displayName?: string } }) =>
        !String(s.id ?? "").startsWith("kick-mock-stream-") && s.user && (s.user.username || s.user.displayName)
      )
      .map((s: {
        id?: string;
        title?: string;
        category?: string;
        viewerCount?: number;
        status?: string;
        cloudflarePlaybackId?: string;
        user: { username?: string; displayName?: string; avatarUrl?: string | null };
      }) => {
        const username = s.user.username ?? s.user.displayName ?? "user";
        const playbackId =
          s.cloudflarePlaybackId && s.cloudflarePlaybackId !== "mock_playback_id"
            ? s.cloudflarePlaybackId
            : null;
        const thumbnailUrl =
          playbackId && cfAcct
            ? `https://customer-${cfAcct}.cloudflarestream.com/${playbackId}/thumbnails/thumbnail.jpg`
            : null;

        return {
          id: `wacke-${s.id ?? username}`,
          source: "wacké" as const,
          username,
          displayName: s.user.displayName ?? username,
          title: s.title ?? "Live from Wacké Studio",
          category: s.category ?? "Live",
          viewerCount: s.viewerCount ?? 0,
          thumbnailUrl,
          avatarUrl: s.user.avatarUrl ?? null,
          isLive: s.status === "live",
        };
      });
  } catch (err) {
    console.warn("[stream-aggregator] Wacké streams unavailable:", err);
    return [];
  }
}

export async function fetchAllStreams(limit = 20): Promise<{
  kick: UnifiedStream[];
  twitch: UnifiedStream[];
  wacke: UnifiedStream[];
  all: UnifiedStream[];
}> {
  const [kick, twitch, wacke] = await Promise.all([
    fetchKickStreams(limit),
    fetchTwitchStreams(limit),
    fetchWackeStreams(limit),
  ]);

  const all = [...wacke, ...kick, ...twitch].sort((a, b) => b.viewerCount - a.viewerCount);
  return { kick, twitch, wacke, all };
}

export async function fetchPlatformStats(): Promise<{
  liveChannels: number;
  totalViewers: number;
  wackeChannels: number;
  boomCount: number;
}> {
  const { all, wacke } = await fetchAllStreams(50);
  const liveOnly = all.filter((s) => s.isLive && !s.isFallback);
  const totalViewers = liveOnly.reduce((sum, s) => sum + s.viewerCount, 0);

  return {
    liveChannels: liveOnly.length,
    totalViewers,
    wackeChannels: wacke.filter((s) => s.isLive).length,
    boomCount: Math.max(totalViewers * 14, 0),
  };
}