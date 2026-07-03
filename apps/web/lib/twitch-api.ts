/**
 * twitch-api.ts
 * Official Twitch Helix API integration using Client Credentials OAuth flow.
 *
 * Twitch API base:    https://api.twitch.tv/helix
 * Token endpoint:     https://id.twitch.tv/oauth2/token
 * Docs:               https://dev.twitch.tv/docs/api/
 */

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_API_BASE  = "https://api.twitch.tv/helix";

// ─── Token Cache (in-memory, server-side only) ───────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

async function getAppAccessToken(): Promise<string | null> {
  const clientId     = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[twitch-api] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
    return null;
  }

  // Reuse cached token (with 60s buffer)
  if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedToken;
  }

  try {
    const res = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    "client_credentials",
      }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[twitch-api] Token fetch failed:", res.status, text);
      return null;
    }

    const data = await res.json();
    _cachedToken    = data.access_token as string;
    _tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    return _cachedToken;
  } catch (err) {
    console.error("[twitch-api] Token request error:", err);
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;          // lowercase username
  user_name: string;           // display name
  game_id: string;
  game_name: string;
  type: "live" | "";
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;       // has {width} and {height} placeholders
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

// ─── Internal fetch helper ───────────────────────────────────────────────────

async function twitchFetch<T>(path: string): Promise<T | null> {
  const token    = await getAppAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!token || !clientId) return null;

  try {
    const res = await fetch(`${TWITCH_API_BASE}${path}`, {
      headers: {
        Authorization:  `Bearer ${token}`,
        "Client-Id":    clientId,
        Accept:         "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[twitch-api] ${path} failed:`, res.status, text);
      return null;
    }

    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[twitch-api] Fetch error for ${path}:`, err);
    return null;
  }
}

// ─── Public API Functions ────────────────────────────────────────────────────

/**
 * Get currently live streams from Twitch (most popular first).
 * Optionally filter by game/category name.
 */
export async function getTwitchLivestreams(
  limit = 20,
  gameId?: string
): Promise<TwitchStream[]> {
  const params = new URLSearchParams({
    first: String(Math.min(limit, 100)),
    language: "fr",
    ...(gameId ? { game_id: gameId } : {}),
  });

  const res = await twitchFetch<{ data: TwitchStream[]; pagination: unknown }>(
    `/streams?${params}`
  );
  return res?.data ?? [];
}

/**
 * Get user/channel info for multiple logins at once (max 100).
 */
export async function getTwitchUsers(logins: string[]): Promise<TwitchUser[]> {
  if (logins.length === 0) return [];
  const params = logins.map((l) => `login=${encodeURIComponent(l)}`).join("&");
  const res = await twitchFetch<{ data: TwitchUser[] }>(`/users?${params}`);
  return res?.data ?? [];
}

/**
 * Get a game/category by name.
 */
export async function getTwitchGameByName(name: string): Promise<TwitchGame | null> {
  const res = await twitchFetch<{ data: TwitchGame[] }>(
    `/games?name=${encodeURIComponent(name)}`
  );
  return res?.data?.[0] ?? null;
}

/**
 * Get top games/categories on Twitch right now.
 */
export async function getTwitchTopGames(limit = 10): Promise<TwitchGame[]> {
  const res = await twitchFetch<{ data: TwitchGame[] }>(
    `/games/top?first=${limit}`
  );
  return res?.data ?? [];
}

/**
 * Resolve a Twitch thumbnail URL by replacing placeholders with real dimensions.
 */
export function resolveTwitchThumbnail(url: string, width = 640, height = 360): string {
  return url
    .replace("{width}", String(width))
    .replace("{height}", String(height));
}

/**
 * Build a Twitch channel embed player URL for an iframe.
 * Requires parent domain for embedding.
 */
export function getTwitchPlayerUrl(username: string, parentDomain: string): string {
  return `https://player.twitch.tv/?channel=${username}&parent=${parentDomain}&autoplay=true&muted=true`;
}
