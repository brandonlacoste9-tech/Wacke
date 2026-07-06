import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseMocked } from "@/lib/config";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/kick/login
 * Initiates Kick.com OAuth2 + PKCE flow.
 */
export async function GET(req: NextRequest) {
  const reqOrigin = new URL(req.url).origin;
  // Force consistent production domain to avoid www vs apex or Netlify subdomain mismatches with registered redirect
  const origin = process.env.NODE_ENV === "production" ? "https://wacke.live" : reqOrigin;

  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  const isKickMocked = !clientId || clientId.includes("your-kick-client-id") || !clientSecret;

  if (isKickMocked) {
    // In Mock Mode, bypass the real Kick.com servers and redirect directly to callback
    const mockCode = "mock-kick-auth-code-" + Math.random().toString(36).substring(5);
    const mockState = "mock-state-123456";
    
    const response = NextResponse.redirect(
      `${origin}/api/auth/kick/callback?code=${mockCode}&state=${mockState}`
    );
    
    // Set mock cookie for state validation
    response.cookies.set("kick_oauth_state", mockState, { path: "/", maxAge: 600 });
    return response;
  }

  const redirectUri = `${origin}/api/auth/kick/callback`;
  console.log("[KICK_LOGIN] Initiating authorize with redirect_uri:", redirectUri);

  // 1. Generate state & PKCE parameters
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("hex");
  
  // Compute code challenge using SHA-256 base64url encoding
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // 2. Redirect URL construction
  const authUrl = new URL("https://id.kick.com/oauth/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  
  // Kick OAuth 2.1 developer workaround for 127.0.0.1 host redirect URI
  if (redirectUri.includes("127.0.0.1")) {
    authUrl.searchParams.set("redirect", "127.0.0.1");
  }
  
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "user:read chat:write");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");


  // 3. Store cookies for validation in the callback handler
  cookies().set("kick_oauth_state", state, {
    path: "/",
    httpOnly: true,
    maxAge: 600, // 10 minutes
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  cookies().set("kick_oauth_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(authUrl.toString());
}
