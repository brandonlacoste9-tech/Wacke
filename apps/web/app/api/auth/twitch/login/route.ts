import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/twitch/login
 * Initiates Twitch OAuth2 + PKCE flow.
 * Scopes requested: user:read:email (to get email + profile info)
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "TWITCH_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${origin}/api/auth/twitch/callback`;

  // 1. Generate CSRF state & PKCE parameters
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // 2. Build Twitch authorization URL
  const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "user:read:email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  // 3. Store state + verifier in cookies for callback validation
  const cookieOpts = {
    path: "/",
    httpOnly: true,
    maxAge: 600, // 10 minutes
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookies().set("twitch_oauth_state", state, cookieOpts);
  cookies().set("twitch_oauth_verifier", codeVerifier, cookieOpts);

  return NextResponse.redirect(authUrl.toString());
}
