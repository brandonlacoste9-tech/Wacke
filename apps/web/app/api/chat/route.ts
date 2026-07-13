import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStreamById, getUserBySupabaseId, createChatMessage } from "@wacke/db";
import { moderateMessage } from "@/lib/moderation";
import { resolveAuthUserId } from "@/lib/auth-api";
import {
  RATE_LIMITS,
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUserId = await resolveAuthUserId(
      req.headers.get("Authorization")
    );
    if (!authUserId) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const ip = clientIp(req);
    const rlUser = rateLimit(`chat:u:${authUserId}`, RATE_LIMITS.chat);
    if (!rlUser.ok) {
      const r = rateLimitResponse(rlUser);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }
    const rlIp = rateLimit(`chat:ip:${ip}`, {
      limit: 20,
      windowMs: 10_000,
    });
    if (!rlIp.ok) {
      const r = rateLimitResponse(rlIp);
      return NextResponse.json(r.body, { status: r.status, headers: r.headers });
    }

    const body = await req.json();
    const { streamId, content } = body as {
      streamId: string;
      content: string;
    };

    if (!streamId || !content) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const stream = await getStreamById(streamId);
    if (!stream || stream.status !== "live") {
      return NextResponse.json(
        { error: "Stream non trouvé ou hors ligne" },
        { status: 404 }
      );
    }

    const dbUser = await getUserBySupabaseId(authUserId);
    if (!dbUser || dbUser.isBanned) {
      return NextResponse.json({ error: "Compte non autorisé" }, { status: 403 });
    }

    const modResult = moderateMessage(content, stream.sacreModeEnabled);
    if (!modResult.allowed) {
      return NextResponse.json(
        { error: modResult.reason, code: modResult.code },
        { status: 422 }
      );
    }

    const newMessage = await createChatMessage({
      streamId,
      userId: dbUser.id,
      content: modResult.sanitized,
      isSacre: modResult.isSacre,
    });

    const hydratedMessage = {
      ...newMessage,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl,
      },
    };

    const supabase = getSupabaseAdmin();
    await supabase.channel(`graffiti-chat:${streamId}`).send({
      type: "broadcast",
      event: "chat_message",
      payload: hydratedMessage,
    });

    return NextResponse.json(
      { message: hydratedMessage },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": String(rlUser.remaining),
        },
      }
    );
  } catch (error) {
    console.error("[CHAT_API_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
