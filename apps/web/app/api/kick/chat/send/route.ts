import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/kick/chat/send
 * 
 * Proxy endpoint that sends a message to a Kick chatroom using the user's
 * Kick OAuth access token (stored in kick_access_token cookie).
 * 
 * Body: { chatroomId: number | string, content: string }
 */
export async function POST(req: NextRequest) {
  const kickToken = req.cookies.get("kick_access_token")?.value;

  if (!kickToken) {
    return NextResponse.json(
      { error: "Not authenticated with Kick. Please login with Kick to send messages." },
      { status: 401 }
    );
  }

  let body: { chatroomId?: string | number; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { chatroomId, content } = body;

  if (!chatroomId || !content?.trim()) {
    return NextResponse.json({ error: "chatroomId and content are required" }, { status: 400 });
  }

  if (content.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
  }

  try {
    // Official Kick API v1 chat send endpoint
    const res = await fetch("https://api.kick.com/public/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${kickToken}`,
      },
      body: JSON.stringify({
        chatroom_id: Number(chatroomId),
        content: content.trim(),
        type: "message",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[kick/chat/send] Kick API error:", res.status, errText);

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { error: "Kick session expired. Please re-login with Kick." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Kick API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[kick/chat/send] Error:", err);
    return NextResponse.json({ error: "Failed to send message to Kick" }, { status: 500 });
  }
}
