import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /auth/callback
 * Handles magic link login / signup confirmation code exchange from Supabase.
 * Sets the 'wacke_token' cookie and redirects the user.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard/stream";

  if (code) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session) {
        const redirectUrl = new URL(next, origin);
        const response = NextResponse.redirect(redirectUrl);
        
        // Save the access token in cookie
        response.cookies.set("wacke_token", data.session.access_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        
        return response;
      }
    } catch (err) {
      console.error("[AUTH_CALLBACK_ERROR]", err);
    }
  }

  // Redirect to login page if token exchange fails
  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set("error", "callback_failed");
  return NextResponse.redirect(loginUrl);
}
