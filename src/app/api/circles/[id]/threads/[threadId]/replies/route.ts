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
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, threadId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { content, mediaUrls } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Check thread exists and is not locked
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId, circleId },
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
        threadId,
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
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/threads/[threadId]/replies error:", error);
    return NextResponse.json({ error: error.message || "Failed to create reply" }, { status: 500 });
  }
}

// GET /api/circles/[id]/threads/[threadId]/replies - List replies (standalone)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, threadId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.threadReply.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.threadReply.count({ where: { threadId } }),
    ]);

    return NextResponse.json({
      replies,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/threads/[threadId]/replies error:", error);
    return NextResponse.json({ error: error.message || "Failed to list replies" }, { status: 500 });
  }
}
