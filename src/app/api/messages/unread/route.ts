import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all conversations the user is part of with their lastReadAt
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    if (participations.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    // Count unread messages across all conversations
    const counts = await Promise.all(
      participations.map((p) =>
        prisma.message.count({
          where: {
            conversationId: p.conversationId,
            createdAt: { gt: p.lastReadAt },
            senderId: { not: userId },
          },
        })
      )
    );

    const unreadCount = counts.reduce((sum, c) => sum + c, 0);

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    console.error("GET /api/messages/unread error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
