import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Check membership
  const auth = await withCircleAuth(post.circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const existing = await prisma.fistBump.findUnique({
    where: { userId_postId: { userId, postId: post.id } },
  });

  if (existing) {
    // Remove fist bump
    await prisma.$transaction([
      prisma.fistBump.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: post.id },
        data: { fistBumpCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ fistBumped: false, count: Math.max(0, post.fistBumpCount - 1) });
  } else {
    // Add fist bump
    await prisma.$transaction([
      prisma.fistBump.create({ data: { userId, postId: post.id } }),
      prisma.post.update({
        where: { id: post.id },
        data: { fistBumpCount: { increment: 1 } },
      }),
    ]);

    // Notify post author
    if (post.authorId !== userId) {
      const bumper = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await createNotification({
        userId: post.authorId,
        type: "FIST_BUMP",
        title: `${bumper?.name ?? "Someone"} fist-bumped your post`,
        actionUrl: `/feed?post=${post.id}`,
      });

      // Create feed item for post author
      await prisma.feedItem.create({
        data: {
          userId: post.authorId,
          type: "FIST_BUMP",
          actorId: userId,
          circleId: post.circleId,
          postId: post.id,
        },
      });
    }

    return NextResponse.json({ fistBumped: true, count: post.fistBumpCount + 1 });
  }
}
