// cache bust 2
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseMocked } from "@/lib/config";
import { syncUser } from "@wacke/db";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/kick/callback
 * Handles the redirect from Kick's authorization server.
 * Exchanges the code for user profiles, synchronizes the database, and sets the session cookie.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin: reqOrigin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const kickError = searchParams.get("error");
  const kickErrorDesc = searchParams.get("error_description") || searchParams.get("error");

  // Use NEXT_PUBLIC_APP_URL if defined (recommended for production/Netlify),
  // otherwise fallback to the incoming request's origin.
  const origin = process.env.NEXT_PUBLIC_APP_URL 
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') 
    : reqOrigin;

  const stateCookie = req.cookies.get("kick_oauth_state")?.value;
  const verifierCookie = req.cookies.get("kick_oauth_verifier")?.value;

  const redirectUri = `${origin}/api/auth/kick/callback`;

  // Check for errors returned by Kick during authorization (e.g. redirect_uri_mismatch, access_denied)
  if (kickError) {
    console.error("[KICK_AUTH_ERROR_FROM_KICK]", kickError, kickErrorDesc, "computed redirectUri:", redirectUri, "incoming origin:", reqOrigin);
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "kick_callback_failed");
    const detailMsg = `Kick rejected the redirect_uri=${redirectUri}. Register EXACTLY these two in your Kick app OAuth settings: ${origin}/api/auth/kick/callback and ${origin.replace('https://', 'https://www.')}/api/auth/kick/callback . Make sure your domain matches. No trailing slash, exact match.`;
    errorUrl.searchParams.set("detail", detailMsg.slice(0, 300));
    return NextResponse.redirect(errorUrl);
  }

  // 1. State CSRF Validation
  if (!state || state !== stateCookie) {
    console.error("[KICK_CALLBACK] CSRF mismatch", {
      statePresent: !!state,
      cookiePresent: !!stateCookie,
      statePrefix: state?.slice(0, 8),
      cookiePrefix: stateCookie?.slice(0, 8),
    });
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "csrf_failed");
    errorUrl.searchParams.set("detail", stateCookie ? "State param does not match cookie — try again" : "State cookie missing — cookies may be blocked");
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.error("[KICK_CALLBACK_NO_CODE]", "state present but no code. incoming origin:", reqOrigin, "computed origin:", origin);
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "missing_code");
    errorUrl.searchParams.set("detail", "No authorization code returned from Kick. This usually means Kick rejected the authorize request (check redirect URI registration in your Kick app settings).");
    return NextResponse.redirect(errorUrl);
  }

  try {
    let kickUser = {
      id: "",
      email: "",
      username: "",
      displayName: "",
    };

    const clientId = process.env.KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    const isKickMocked = !clientId || clientId.includes("your-kick-client-id") || !clientSecret;

    if (isKickMocked) {
      // Mock OAuth Flow: Generate simulated Kick user details
      const randomId = Math.random().toString(36).substring(5);
      kickUser = {
        id: "kick-uuid-mock-" + randomId,
        email: `kick_chum_${randomId}@mock.wacke.ca`,
        username: `kickseur_${randomId}`,
        displayName: `Wacké Kickeur 🟢`,
      };
    } else {
      // Real OAuth Flow: Exchange code for user token
      const redirectUri = `${origin}/api/auth/kick/callback`;
      console.log("[KICK_CALLBACK] Using redirect_uri:", redirectUri);

      if (!verifierCookie) {
        throw new Error("Code verifier cookie manquant");
      }

      if (!clientId || !clientSecret) {
        throw new Error("KICK_CLIENT_ID or KICK_CLIENT_SECRET missing in environment");
      }

      // Token Exchange POST request - MUST use form-urlencoded per Kick docs
      const tokenRes = await fetch("https://id.kick.com/oauth/token", {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code!,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          code_verifier: verifierCookie,
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[KICK_TOKEN_EXCHANGE_ERROR]", tokenRes.status, errText);
        throw new Error(`Échec de l'échange de token: ${tokenRes.status} ${errText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token as string;
      const _kickAccessToken = accessToken; // stored in cookie below

      // Query User Profile GET request
      const profileRes = await fetch("https://api.kick.com/public/v1/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileRes.ok) {
        const errText = await profileRes.text();
        console.error("[KICK_PROFILE_ERROR]", profileRes.status, errText);
        throw new Error(`Kick profile fetch failed: ${profileRes.status}`);
      }

      const profileData = await profileRes.json();
      console.log("[KICK_PROFILE_RAW]", JSON.stringify(profileData).slice(0, 300));

      // Kick API returns { data: [ { ... } ] } or just { ... }
      const kickProfile = profileData?.data?.[0] ?? profileData?.data ?? profileData;

      kickUser = {
        id: String(kickProfile.user_id ?? kickProfile.id ?? ""),
        email: kickProfile.email ?? `${kickProfile.username ?? "user"}@kick.wacke.ca`,
        username: kickProfile.username ?? kickProfile.name ?? "",
        displayName: kickProfile.display_name ?? kickProfile.username ?? kickProfile.name ?? "Kickeur",
      };

      if (!kickUser.username) {
        throw new Error(`No username in Kick profile: ${JSON.stringify(kickProfile).slice(0, 200)}`);
      }

      // Save Kick access token for chat:write capability
      (kickUser as any)._kickAccessToken = _kickAccessToken;
    }

    // 2. Synchronize Kick profile to Wacké Drizzle Database
    const cleanUsername = kickUser.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    // Ensure mock UUID format fits Supabase UUID column in Drizzle
    const validUuid = kickUser.id.includes("-") && kickUser.id.length === 36
      ? kickUser.id
      : "7c62db18-1234-1234-1234-" + Array.from(cleanUsername.slice(0, 6))
          .map((c) => c.charCodeAt(0).toString(16))
          .join("")
          .substring(0, 12)
          .padEnd(12, "0");

    const dbUser = await syncUser({
      supabaseId: validUuid,
      email: kickUser.email,
      username: cleanUsername,
      displayName: kickUser.displayName,
    });

    // 3. Create Session Session Token & Redirect response
    const sessionToken = `mock-session:${dbUser.username}:${dbUser.supabaseId}`;
    const redirectUrl = new URL("/", origin);
    const response = NextResponse.redirect(redirectUrl);

    // Save session token in the global wacke_token cookie
    response.cookies.set("wacke_token", sessionToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Save Kick access token for chat:write capability
    const kickAccessToken = (kickUser as any)._kickAccessToken;
    if (kickAccessToken) {
      response.cookies.set("kick_access_token", kickAccessToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // Save Kick username for client-side Pusher subscription
    response.cookies.set("kick_username", kickUser.username, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Clear OAuth state cookies
    response.cookies.delete("kick_oauth_state");
    response.cookies.delete("kick_oauth_verifier");

    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[KICK_CALLBACK_ERROR]", detail);
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "kick_callback_failed");
    errorUrl.searchParams.set("detail", detail.slice(0, 200));
    return NextResponse.redirect(errorUrl);
  }
}