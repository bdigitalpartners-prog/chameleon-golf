import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, image: true, handicapIndex: true } },
      circle: { select: { id: true, name: true } },
      course: { select: { courseId: true, courseName: true } },
      fistBumps: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check membership
  const auth = await withCircleAuth(post.circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userBump = await prisma.fistBump.findUnique({
    where: { userId_postId: { userId, postId: post.id } },
  });

  return NextResponse.json({ ...post, hasFistBumped: !!userBump });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.authorId !== userId) {
    return NextResponse.json({ error: "Only the author can edit this post" }, { status: 403 });
  }

  const body = await req.json();
  const { content, mediaUrls } = body;

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(content !== undefined && { content }),
      ...(mediaUrls !== undefined && { mediaUrls }),
    },
    include: {
      author: { select: { id: true, name: true, image: true, handicapIndex: true } },
      circle: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Allow author or circle admin/owner
  if (post.authorId !== userId) {
    const auth = await withCircleAuth(post.circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 });
    }
  }

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
