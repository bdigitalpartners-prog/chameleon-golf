import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const conversationId = params.id;
    const body = await req.json();
    const { content, videoUrl, videoTitle, replyToId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If replying, verify the replyTo message exists in this conversation
    if (replyToId) {
      const replyMessage = await prisma.message.findFirst({
        where: { id: replyToId, conversationId },
      });
      if (!replyMessage) {
        return NextResponse.json(
          { error: "Reply message not found" },
          { status: 400 }
        );
      }
    }

    // Create message and update conversation updatedAt in a transaction
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content.trim(),
          videoUrl: videoUrl ?? null,
          videoTitle: videoTitle ?? null,
          replyToId: replyToId ?? null,
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
          replyTo: {
            include: {
              sender: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/messages/conversations/[id]/messages error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
