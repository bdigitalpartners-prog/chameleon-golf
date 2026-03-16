import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { fanOutToCircle } from "@/lib/feed";

export const dynamic = 'force-dynamic';

// GET — List discussion threads
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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
  const category = searchParams.get("category");
  const pinned = searchParams.get("pinned");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const where: any = { circleId };
  if (category) where.category = category;
  if (pinned === "true") where.isPinned = true;

  const [threads, total] = await Promise.all([
    prisma.discussionThread.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.discussionThread.count({ where }),
  ]);

  return NextResponse.json({
    threads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST — Create discussion thread
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const body = await req.json();
  const { title, content, category } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  const validCategories = [
    "CONDITIONS",
    "EVENTS",
    "DINING",
    "PRO_SHOP",
    "GENERAL",
    "TIPS",
  ];
  if (category && !validCategories.includes(category)) {
    return NextResponse.json(
      { error: "Invalid category" },
      { status: 400 }
    );
  }

  // Create thread and first reply in a transaction
  const thread = await prisma.$transaction(async (tx) => {
    const t = await tx.discussionThread.create({
      data: {
        circleId,
        authorId: userId,
        title,
        category: category ?? "GENERAL",
        lastReplyAt: new Date(),
        replyCount: 1,
      },
    });

    await tx.threadReply.create({
      data: {
        threadId: t.id,
        authorId: userId,
        content,
      },
    });

    return tx.discussionThread.findUnique({
      where: { id: t.id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
      },
    });
  });

  await fanOutToCircle({
    circleId,
    type: "NEW_THREAD",
    actorId: userId,
    metadata: { threadId: thread!.id, title, category: thread!.category },
  });

  return NextResponse.json({ thread }, { status: 201 });
}
