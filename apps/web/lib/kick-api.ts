/**
 * kick-api.ts
 * Official Kick API v1 integration using Client Credentials OAuth flow.
 *
 * Kick API base: https://api.kick.com/public/v1
 * Token endpoint: https://id.kick.com/oauth/token
 */

const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
const KICK_API_BASE = "https://api.kick.com/public/v1";

// ─── Token Cache (in-memory, server-side only) ───────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

async function getAppAccessToken(): Promise<string | null> {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[kick-api] Missing KICK_CLIENT_ID or KICK_CLIENT_SECRET");
    return null;
  }

  // Reuse if still valid (with 60s buffer)
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }

  try {
    const res = await fetch(KICK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[kick-api] Token fetch failed:", res.status, text);
      return null;
    }

    const data = await res.json();
    _cachedToken = data.access_token as string;
    _tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    return _cachedToken;
  } catch (err) {
    console.error("[kick-api] Token request error:", err);
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KickLivestream {
  id: string;
  slug: string;                  // channel slug (username)
  channel_id: number;
  session_title: string;         // stream title
  created_at: string;
  language: string;
  is_mature: boolean;
  viewer_count: number;
  thumbnail?: {
    src?: string;
    srcset?: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    parent_category?: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
  channel: {
    id: number;
    user_id: number;
    slug: string;
    channel_description?: string;
    banner_picture?: string;
    profile_picture?: string;
    user: {
      id: number;
      username: string;
      agreed_to_terms: boolean;
      email_verified_at: string | null;
      bio: string | null;
      country: string | null;
      state: string | null;
      city: string | null;
      instagram: string | null;
      twitter: string | null;
      youtube: string | null;
      discord: string | null;
      tiktok: string | null;
      facebook: string | null;
      profile_pic: string | null;
    };
  };
}

export interface KickLivestreamsResponse {
  data: KickLivestream[];
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function kickFetch<T>(path: string): Promise<T | null> {
  const token = await getAppAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${KICK_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[kick-api] ${path} failed:`, res.status, text);
      return null;
    }

    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[kick-api] Fetch error for ${path}:`, err);
    return null;
  }
}

// ─── Public API Functions ─────────────────────────────────────────────────────

/**
 * Get currently live streams from Kick.
 * Returns up to `limit` streams. Optionally filter by category slug.
 */
export async function getKickLivestreams(
  limit = 20,
  categorySlug?: string
): Promise<KickLivestream[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: String(Math.min(limit * 2, 100)), // request more to filter locally if needed
    ...(categorySlug ? { category: categorySlug } : {}),
  });

  const res = await kickFetch<KickLivestreamsResponse>(`/livestreams?${params}`);
  const streams = res?.data ?? [];
  return streams
    .filter((s) => {
      const lang = s.language?.toLowerCase();
      return lang === "fr" || lang === "french" || lang === "en" || lang === "english";
    })
    .slice(0, limit);
}

/**
 * Get channel info by slug (username).
 */
export async function getKickChannel(slug: string): Promise<KickLivestream["channel"] | null> {
  const res = await kickFetch<{ data: KickLivestream["channel"] }>(`/channels?broadcaster_user_login=${slug}`);
  return res?.data ?? null;
}

/**
 * Get multiple channels at once by their slugs.
 */
export async function getKickChannels(slugs: string[]): Promise<KickLivestream["channel"][]> {
  if (slugs.length === 0) return [];
  const params = slugs.map((s) => `broadcaster_user_login=${encodeURIComponent(s)}`).join("&");
  const res = await kickFetch<{ data: KickLivestream["channel"][] }>(`/channels?${params}`);
  return res?.data ?? [];
}

/**
 * Check if a specific channel is live right now.
 * Returns the livestream data or null if offline.
 */
export async function getKickChannelLivestream(slug: string): Promise<KickLivestream | null> {
  const res = await kickFetch<{ data: KickLivestream[] }>(`/livestreams?broadcaster_user_login=${slug}`);
  return res?.data?.[0] ?? null;
}

/**
 * Get the Kick player embed URL for a channel slug.
 */
export function getKickPlayerUrl(slug: string, muted = false): string {
  return `https://player.kick.com/${slug}?autoplay=true&muted=${muted}`;
}

/**
 * Get Kick thumbnail URL, with a fallback gradient.
 * Kick thumbnails look like: https://stream.kick.com/thumbnails/livestream/{id}/1080p/thumbnail.webp
 */
export function getKickThumbnailUrl(stream: KickLivestream): string | null {
  if (stream.thumbnail?.src) return stream.thumbnail.src;
  if (stream.channel?.profile_picture) return stream.channel.profile_picture;
  return null;
}
