import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

// GET — Thread detail with replies
export async function GET(
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

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const thread = await prisma.discussionThread.findUnique({
    where: { id: params.threadId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { replies: true } },
    },
  });

  if (!thread || thread.circleId !== circleId) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const [replies, totalReplies] = await Promise.all([
    prisma.threadReply.findMany({
      where: { threadId: params.threadId },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.threadReply.count({ where: { threadId: params.threadId } }),
  ]);

  return NextResponse.json({
    thread,
    replies,
    totalReplies,
    page,
    totalPages: Math.ceil(totalReplies / limit),
  });
}

// PATCH — Pin/lock thread (ADMIN/OWNER)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const existing = await prisma.discussionThread.findUnique({
    where: { id: params.threadId },
  });
  if (!existing || existing.circleId !== circleId) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.isPinned !== undefined) data.isPinned = Boolean(body.isPinned);
  if (body.isLocked !== undefined) data.isLocked = Boolean(body.isLocked);

  const thread = await prisma.discussionThread.update({
    where: { id: params.threadId },
    data,
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { replies: true } },
    },
  });

  return NextResponse.json({ thread });
}

// DELETE — Delete thread (ADMIN/OWNER or author)
export async function DELETE(
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

  const existing = await prisma.discussionThread.findUnique({
    where: { id: params.threadId },
  });
  if (!existing || existing.circleId !== circleId) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Only ADMIN/OWNER or the thread author can delete
  const isAdmin = auth.membership?.role === "OWNER" || auth.membership?.role === "ADMIN";
  if (!isAdmin && existing.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.discussionThread.delete({ where: { id: params.threadId } });

  return NextResponse.json({ success: true });
}
