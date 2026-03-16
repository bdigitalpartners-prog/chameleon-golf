import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

// POST /api/circles/[id]/threads/[threadId]/replies - Add a reply to a thread
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  return withCircleAuth(params.id, ["OWNER", "ADMIN", "MEMBER"], async (session) => {
    const userId = (session?.user as any)?.id;
    const { content, mediaUrls } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Check thread exists and is not locked
    const thread = await prisma.discussionThread.findUnique({
      where: { id: params.threadId, circleId: params.id },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { error: "Thread is locked" },
        { status: 403 }
      );
    }

    const reply = await prisma.threadReply.create({
      data: {
        threadId: params.threadId,
        authorId: userId,
        content,
        mediaUrls: mediaUrls || [],
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Update thread reply count and lastReplyAt
    await prisma.discussionThread.update({
      where: { id: params.threadId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
      },
    });

    return NextResponse.json(reply, { status: 201 });
  });
}
