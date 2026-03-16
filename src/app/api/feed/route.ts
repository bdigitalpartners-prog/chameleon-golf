import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const circleId = searchParams.get("circleId");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const where: any = { userId };
  if (circleId) where.circleId = circleId;
  if (cursor) where.createdAt = { lt: new Date(cursor) };

  const feedItems = await prisma.feedItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      actor: { select: { id: true, name: true, image: true } },
      circle: { select: { id: true, name: true } },
      post: {
        include: {
          author: { select: { id: true, name: true, image: true, handicapIndex: true } },
          circle: { select: { id: true, name: true } },
          course: { select: { courseId: true, courseName: true } },
          fistBumps: {
            take: 3,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
    },
  });

  // Check which posts user has fist-bumped
  const postIds = feedItems
    .slice(0, limit)
    .map((fi) => fi.postId)
    .filter((id): id is string => !!id);

  const userBumps = await prisma.fistBump.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  const bumpedSet = new Set(userBumps.map((b) => b.postId));

  const hasMore = feedItems.length > limit;
  const results = feedItems.slice(0, limit).map((item) => ({
    ...item,
    post: item.post ? { ...item.post, hasFistBumped: bumpedSet.has(item.post.id) } : null,
  }));

  const nextCursor = hasMore && results.length > 0
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({ feedItems: results, nextCursor });
}
