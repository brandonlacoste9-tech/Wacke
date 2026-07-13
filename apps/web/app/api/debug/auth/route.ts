import { NextRequest, NextResponse } from "next/server";
import { isSupabaseMocked } from "@/lib/config";

/**
 * GET /api/debug/auth
 * Dev-only diagnostics. Disabled in production unless DEBUG_AUTH_SECRET matches.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.DEBUG_AUTH_SECRET;
  const provided = req.headers.get("x-debug-secret");
  const allowed =
    process.env.NODE_ENV !== "production" ||
    (secret && provided && secret === provided);

  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    isMocked: isSupabaseMocked(),
    supabaseHost: url ? new URL(url).host : null,
    hasAnonKey: hasAnon,
    hasServiceRole: hasService,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV,
    // Never return key previews or connection string fragments in responses
  });
}
