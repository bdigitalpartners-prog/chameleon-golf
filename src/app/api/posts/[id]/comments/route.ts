import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";
import { processMentions } from "@/lib/feed";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const auth = await withCircleAuth(post.circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { content, parentId } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  // Validate parentId if provided
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== params.id) {
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      authorId: userId,
      postId: params.id,
      content: content.trim(),
      parentId: parentId ?? null,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  // Increment comment count
  await prisma.post.update({
    where: { id: params.id },
    data: { commentCount: { increment: 1 } },
  });

  const commenter = comment.author;

  // Notify post author
  if (post.authorId !== userId) {
    await createNotification({
      userId: post.authorId,
      type: "COMMENT",
      title: `${commenter.name ?? "Someone"} commented on your post`,
      body: content.slice(0, 100),
      actionUrl: `/feed?post=${post.id}`,
    });
  }

  // Notify parent comment author (for replies)
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (parent && parent.authorId !== userId && parent.authorId !== post.authorId) {
      await createNotification({
        userId: parent.authorId,
        type: "COMMENT_REPLY",
        title: `${commenter.name ?? "Someone"} replied to your comment`,
        body: content.slice(0, 100),
        actionUrl: `/feed?post=${post.id}`,
      });
    }
  }

  // Process mentions
  await processMentions({ content, authorId: userId, postId: params.id, commentId: comment.id });

  return NextResponse.json(comment, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const where: any = { postId: params.id, parentId: null };
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  const hasMore = comments.length > limit;
  const results = comments.slice(0, limit);
  const nextCursor = hasMore && results.length > 0
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({ comments: results, nextCursor });
}
