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
  return withCircleAuth(params.id, ["OWNER", "ADMIN", "MEMBER"], async () => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const thread = await prisma.discussionThread.findUnique({
      where: { id: params.threadId, circleId: params.id },
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
        where: { threadId: params.threadId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.threadReply.count({ where: { threadId: params.threadId } }),
    ]);

    return NextResponse.json({
      thread,
      replies,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  });
}

// PATCH /api/circles/[id]/threads/[threadId] - Pin or lock a thread
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  return withCircleAuth(params.id, ["OWNER", "ADMIN"], async () => {
    const body = await req.json();
    const data: any = {};

    if (typeof body.isPinned === "boolean") {
      data.isPinned = body.isPinned;
    }
    if (typeof body.isLocked === "boolean") {
      data.isLocked = body.isLocked;
    }

    const thread = await prisma.discussionThread.update({
      where: { id: params.threadId, circleId: params.id },
      data,
    });

    return NextResponse.json(thread);
  });
}

// DELETE /api/circles/[id]/threads/[threadId] - Delete a thread
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First check if the user is the thread author
  const thread = await prisma.discussionThread.findUnique({
    where: { id: params.threadId, circleId: params.id },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.authorId === userId) {
    // Author can delete their own thread
    await prisma.discussionThread.delete({
      where: { id: params.threadId },
    });
    return NextResponse.json({ success: true });
  }

  // If not the author, must be ADMIN or OWNER
  return withCircleAuth(params.id, ["OWNER", "ADMIN"], async () => {
    await prisma.discussionThread.delete({
      where: { id: params.threadId },
    });
    return NextResponse.json({ success: true });
  });
}
