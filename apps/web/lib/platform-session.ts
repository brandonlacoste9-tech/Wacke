import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed platform sessions for Kick/Twitch OAuth (and local demo only).
 * Format: wacke1.<base64url-payload>.<hmac>
 *
 * Legacy forgeable tokens (mock-session:user:id) are REJECTED in production
 * unless ALLOW_LEGACY_MOCK_AUTH=true (never set on public hosts).
 */

const PREFIX = "wacke1";

function secret(): string {
  const s =
    process.env.WACKE_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[platform-session] Missing WACKE_SESSION_SECRET / SESSION_SECRET / SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    return "wacke-dev-insecure-secret-change-me";
  }
  return s;
}

export function allowLegacyMockAuth(): boolean {
  if (process.env.ALLOW_LEGACY_MOCK_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export type PlatformSession = {
  provider: "kick" | "twitch" | "mock";
  username: string;
  supabaseId: string;
};

export function createPlatformSession(
  opts: PlatformSession & { maxAgeSec?: number }
): string {
  const exp =
    Math.floor(Date.now() / 1000) + (opts.maxAgeSec ?? 60 * 60 * 24 * 7);
  const payload = Buffer.from(
    JSON.stringify({
      p: opts.provider,
      u: opts.username,
      s: opts.supabaseId,
      e: exp,
    }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${PREFIX}.${payload}.${sig}`;
}

export function verifyPlatformSession(token: string): PlatformSession | null {
  if (!token) return null;

  if (token.startsWith(`${PREFIX}.`)) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [, payload, sig] = parts;
    const expected = createHmac("sha256", secret())
      .update(payload)
      .digest("base64url");
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    } catch {
      return null;
    }
    try {
      const data = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8")
      ) as { p: string; u: string; s: string; e: number };
      if (!data.s || !data.u || data.e < Math.floor(Date.now() / 1000)) {
        return null;
      }
      const provider =
        data.p === "kick" || data.p === "twitch" || data.p === "mock"
          ? data.p
          : "mock";
      return {
        provider,
        username: data.u,
        supabaseId: data.s,
      };
    } catch {
      return null;
    }
  }

  // Legacy forgeable tokens — development / explicit opt-in only
  if (!allowLegacyMockAuth()) return null;

  if (
    token.startsWith("mock-session:") ||
    token.startsWith("twitch-session:") ||
    token.startsWith("kick-session:")
  ) {
    const parts = token.split(":");
    if (parts.length < 3) return null;
    const providerRaw = parts[0];
    const provider =
      providerRaw === "twitch-session"
        ? "twitch"
        : providerRaw === "kick-session"
          ? "kick"
          : "mock";
    return {
      provider,
      username: parts[1],
      supabaseId: parts.slice(2).join(":"),
    };
  }

  return null;
}

/** Resolve supabase user id from Authorization Bearer or raw token */
export function resolvePlatformUserId(token: string | null | undefined): string | null {
  if (!token) return null;
  const t = token.replace(/^Bearer\s+/i, "").trim();
  const session = verifyPlatformSession(t);
  return session?.supabaseId ?? null;
}
