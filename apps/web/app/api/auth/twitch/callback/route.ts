import { NextRequest, NextResponse } from "next/server";
import { syncUser, updateUserProfile } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/twitch/callback
 * Handles the OAuth redirect from Twitch.
 * Exchanges code for tokens, fetches user profile, syncs to DB.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const stateCookie = req.cookies.get("twitch_oauth_state")?.value;
  const verifierCookie = req.cookies.get("twitch_oauth_verifier")?.value;

  // 1. CSRF state validation
  if (!state || state !== stateCookie) {
    console.error("[TWITCH_CALLBACK] CSRF mismatch", { state, stateCookie: stateCookie?.slice(0, 8) });
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "csrf_failed");
    errorUrl.searchParams.set("detail", "State mismatch — try clicking the Twitch button again");
    return NextResponse.redirect(errorUrl);
  }

  if (!code || !verifierCookie) {
    console.error("[TWITCH_CALLBACK] Missing code or verifier", { code: !!code, verifier: !!verifierCookie });
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "missing_code");
    errorUrl.searchParams.set("detail", !code ? "No auth code received from Twitch" : "PKCE verifier cookie missing");
    return NextResponse.redirect(errorUrl);
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[TWITCH_CALLBACK] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "server_config");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const redirectUri = `${origin}/api/auth/twitch/callback`;

    // 2. Exchange authorization code for access token (PKCE)
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: verifierCookie,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[TWITCH_TOKEN_EXCHANGE_ERROR]", tokenRes.status, errText);
      throw new Error("Échec de l'échange de token Twitch");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;

    // 3. Fetch Twitch user profile using the user access token
    const profileRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
      },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      console.error("[TWITCH_PROFILE_FETCH_ERROR]", profileRes.status, errText);
      throw new Error("Échec de la récupération du profil Twitch");
    }

    const profileData = await profileRes.json();
    console.log("[TWITCH_PROFILE_RAW]", JSON.stringify(profileData).slice(0, 300));
    const twitchUser = profileData.data?.[0];

    if (!twitchUser) {
      throw new Error("Aucun profil Twitch retourné");
    }

    // 4. Sync Twitch user to Wacké database
    const cleanUsername = twitchUser.login.toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Use a deterministic UUID derived from twitch user ID (not a real UUID from Supabase Auth)
    // We prefix twitch IDs so they don't collide with kick/google users
    const twitchUuid = `twitch-${twitchUser.id}`;
    const validUuid = twitchUuid.length === 36 && twitchUuid.includes("-")
      ? twitchUuid
      : "7c62db18-0001-0001-0001-" +
        Array.from(String(twitchUser.id).slice(0, 12))
          .map((c: string) => c.charCodeAt(0).toString(16))
          .join("")
          .substring(0, 12)
          .padEnd(12, "0");

    const dbUser = await syncUser({
      supabaseId: validUuid,
      email: twitchUser.email || `${cleanUsername}@twitch.wacke.ca`,
      username: cleanUsername,
      displayName: twitchUser.display_name || cleanUsername,
    });

    // 5. Save twitchUsername + avatarUrl on user profile
    await updateUserProfile({
      userId: dbUser.id,
      twitchUsername: twitchUser.login,
      avatarUrl: twitchUser.profile_image_url || undefined,
    });

    // 6. Build session token & set cookies
    const sessionToken = `twitch-session:${dbUser.username}:${dbUser.supabaseId}`;
    const redirectUrl = new URL("/", origin);
    const response = NextResponse.redirect(redirectUrl);

    const cookieOpts = {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    response.cookies.set("wacke_token", sessionToken, cookieOpts);
    response.cookies.set("twitch_access_token", accessToken, cookieOpts);
    response.cookies.set("twitch_username", twitchUser.login, cookieOpts);

    // Clear PKCE / state cookies
    response.cookies.delete("twitch_oauth_state");
    response.cookies.delete("twitch_oauth_verifier");

    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[TWITCH_CALLBACK_ERROR]", detail);
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "twitch_callback_failed");
    errorUrl.searchParams.set("detail", detail.slice(0, 200));
    return NextResponse.redirect(errorUrl);
  }
}
