import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

// POST — Add reply to thread
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, [
    "OWNER",
    "ADMIN",
    "MEMBER",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const thread = await prisma.discussionThread.findUnique({
    where: { id: params.threadId },
  });

  if (!thread || thread.circleId !== circleId) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.isLocked) {
    return NextResponse.json(
      { error: "Thread is locked" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const reply = await prisma.threadReply.create({
    data: {
      threadId: params.threadId,
      authorId: userId,
      content,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  // Update thread reply tracking
  await prisma.discussionThread.update({
    where: { id: params.threadId },
    data: { lastReplyAt: new Date(), replyCount: { increment: 1 } },
  });

  // Notify thread author
  if (thread.authorId !== userId) {
    await createNotification({
      userId: thread.authorId,
      type: "THREAD_REPLY",
      title: `New reply on "${thread.title}"`,
      body: `${(session.user as any).name ?? "Someone"} replied to your thread`,
      actionUrl: `/circles/${circleId}`,
    });
  }

  return NextResponse.json({ reply }, { status: 201 });
}
