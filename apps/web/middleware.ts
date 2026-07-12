import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED_USERNAMES = new Set([
  "auth", "api", "browse", "stream", "profile", "dashboard", "settings",
  "build", "claims", "onboarding", "favicon.ico",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Default FR for Québec visitors without a saved language preference
  if (!request.cookies.has("wacke_lang")) {
    const country = request.headers.get("x-vercel-ip-country");
    const region = request.headers.get("x-vercel-ip-country-region");
    if (country === "CA" && region === "QC") {
      response.cookies.set("wacke_lang", "fr", {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }
  }

  // Redirect dashboard to studio
  if (pathname.toLowerCase() === "/dashboard" || pathname.toLowerCase() === "/dashboard/") {
    return NextResponse.redirect(new URL("/dashboard/studio", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};