import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolvePlatformUserId, verifyPlatformSession } from "@/lib/platform-session";

/**
 * Resolve authenticated Supabase user id from Authorization header.
 * Accepts:
 *  - Signed Wacke platform sessions (Kick/Twitch OAuth)
 *  - Real Supabase JWTs (verified via auth.getUser)
 * Rejects forgeable legacy mock tokens in production.
 */
export async function resolveAuthUserId(
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const platformId = resolvePlatformUserId(token);
  if (platformId) return platformId;

  // Real Supabase access token
  if (token.includes(".") && !token.startsWith("wacke1.")) {
    try {
      const supabase = getSupabaseAdmin();
      // Bypass interceptor path: getUser still verifies real JWTs;
      // unsigned mock-session tokens are rejected by platform-session in prod
      // and only accepted via verifyPlatformSession when legacy allowed.
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user?.id) return user.id;
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function isPlatformToken(token: string): boolean {
  return Boolean(verifyPlatformSession(token.replace(/^Bearer\s+/i, "").trim()));
}
