import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ConversationType } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    // If searching by participant name, find matching user IDs first
    let matchingUserIds: string[] = [];
    if (search) {
      const matchingUsers = await prisma.user.findMany({
        where: { name: { contains: search, mode: "insensitive" } },
        select: { id: true },
      });
      matchingUserIds = matchingUsers.map((u) => u.id);
    }

    const where: any = {
      participants: { some: { userId } },
    };

    if (search) {
      where.OR = [
        {
          messages: {
            some: { content: { contains: search, mode: "insensitive" } },
          },
        },
        {
          participants: {
            some: { userId: { in: matchingUserIds } },
          },
        },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Compute unread counts for each conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const myParticipant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = myParticipant?.lastReadAt ?? new Date(0);

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: userId },
          },
        });

        return {
          id: conv.id,
          type: conv.type,
          title: conv.title,
          circleId: conv.circleId,
          courseId: conv.courseId,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          participants: conv.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            joinedAt: p.joinedAt,
          })),
          lastMessage: conv.messages[0]
            ? {
                id: conv.messages[0].id,
                content: conv.messages[0].content,
                senderId: conv.messages[0].senderId,
                senderName: conv.messages[0].sender?.name,
                createdAt: conv.messages[0].createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: result });
  } catch (error: any) {
    console.error("GET /api/messages/conversations error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { participantIds, type, circleId, courseId, title } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: "participantIds is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    const allParticipantIds = Array.from(new Set([userId, ...participantIds]));
    const conversationType = (type as ConversationType) ?? "DIRECT";

    // For DIRECT conversations, check if one already exists between exactly these participants
    if (conversationType === "DIRECT") {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          participants: {
            every: {
              userId: { in: allParticipantIds },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      });

      // Verify the participant count matches exactly
      if (existing && existing.participants.length === allParticipantIds.length) {
        return NextResponse.json(existing);
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: conversationType,
        title: title ?? null,
        circleId: circleId ?? null,
        courseId: courseId ?? null,
        participants: {
          create: allParticipantIds.map((id) => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/messages/conversations error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
