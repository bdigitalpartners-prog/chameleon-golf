import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { fanOutToCircle, processMentions } from "@/lib/feed";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const { circleId, content, type = "TEXT", mediaUrls = [], courseId } = body;

  if (!circleId) {
    return NextResponse.json({ error: "circleId is required" }, { status: 400 });
  }

  if (!content && mediaUrls.length === 0) {
    return NextResponse.json({ error: "Post must have content or media" }, { status: 400 });
  }

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const post = await prisma.post.create({
    data: {
      authorId: userId,
      circleId,
      content: content ?? null,
      type,
      mediaUrls,
      courseId: courseId ? Number(courseId) : null,
    },
    include: {
      author: { select: { id: true, name: true, image: true, handicapIndex: true } },
      circle: { select: { id: true, name: true } },
      course: { select: { courseId: true, courseName: true } },
    },
  });

  // Fan out to circle members
  await fanOutToCircle({
    circleId,
    type: "POST_CREATED",
    actorId: userId,
    postId: post.id,
    courseId: courseId ? Number(courseId) : undefined,
  });

  // Process @mentions
  if (content) {
    await processMentions({ content, authorId: userId, postId: post.id });
  }

  return NextResponse.json(post, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const circleId = searchParams.get("circleId");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  // Build where clause
  const where: any = {};

  if (circleId) {
    where.circleId = circleId;
  } else {
    // Global feed: posts from all circles user belongs to
    const memberships = await prisma.circleMembership.findMany({
      where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      select: { circleId: true },
    });
    where.circleId = { in: memberships.map((m) => m.circleId) };
  }

  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
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
  });

  // Check if user has fist-bumped each post
  const postIds = posts.slice(0, limit).map((p) => p.id);
  const userBumps = await prisma.fistBump.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  const bumpedSet = new Set(userBumps.map((b) => b.postId));

  const hasMore = posts.length > limit;
  const results = posts.slice(0, limit).map((post) => ({
    ...post,
    hasFistBumped: bumpedSet.has(post.id),
  }));

  const nextCursor = hasMore && results.length > 0
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({ posts: results, nextCursor });
}
