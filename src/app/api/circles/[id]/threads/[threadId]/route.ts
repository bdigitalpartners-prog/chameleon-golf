import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

// GET /api/circles/[id]/threads/[threadId] - Get thread with paginated replies
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId, circleId },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

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
      thread,
      replies,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/threads/[threadId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/circles/[id]/threads/[threadId] - Pin or lock a thread
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, threadId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const data: any = {};

    if (typeof body.isPinned === "boolean") {
      data.isPinned = body.isPinned;
    }
    if (typeof body.isLocked === "boolean") {
      data.isLocked = body.isLocked;
    }

    const thread = await prisma.discussionThread.update({
      where: { id: threadId, circleId },
      data,
    });

    return NextResponse.json(thread);
  } catch (error: any) {
    console.error("PATCH /api/circles/[id]/threads/[threadId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/circles/[id]/threads/[threadId] - Delete a thread
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId, threadId } = params;

    // First check if the user is the thread author
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId, circleId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.authorId === userId) {
      // Author can delete their own thread
      await prisma.discussionThread.delete({
        where: { id: threadId },
      });
      return NextResponse.json({ success: true });
    }

    // If not the author, must be ADMIN or OWNER
    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await prisma.discussionThread.delete({
      where: { id: threadId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/circles/[id]/threads/[threadId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
