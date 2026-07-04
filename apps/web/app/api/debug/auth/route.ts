import { NextResponse } from "next/server";
import { isSupabaseMocked } from "@/lib/config";

/**
 * GET /api/debug/auth
 * Temporary diagnostic endpoint.
 * Returns sanitized Supabase config info (no secret values).
 * Remove or protect this after login is working.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonPreview = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 12) + "..." || "missing";
  const servicePreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8) + "..." || "missing";

  const dbUrl = process.env.DATABASE_URL || "";
  const dbPreview = dbUrl ? dbUrl.split("@")[0].slice(0, 30) + "@..." : "missing";

  return NextResponse.json({
    isMocked: isSupabaseMocked(),
    supabaseUrl: url,
    hasAnonKey: hasAnon,
    anonKeyPreview: anonPreview,
    hasServiceRole: hasService,
    serviceRolePreview: servicePreview,
    databaseUrlPreview: dbPreview,
    nodeEnv: process.env.NODE_ENV,
    note: "If supabaseUrl is not exactly https://ezkctufrqexxhujiitag.supabase.co then the env var was not set correctly at build time.",
  });
}
