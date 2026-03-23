import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const conversations = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cc.id, cc.session_id, cc.created_at,
              (SELECT COUNT(*) FROM concierge_messages cm WHERE cm.conversation_id = cc.id) as message_count,
              (SELECT cm.content FROM concierge_messages cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at ASC LIMIT 1) as first_message
       FROM concierge_conversations cc
       WHERE cc.session_id = $1
       ORDER BY cc.created_at DESC
       LIMIT $2 OFFSET $3`,
      sessionId,
      limit,
      offset
    );

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
