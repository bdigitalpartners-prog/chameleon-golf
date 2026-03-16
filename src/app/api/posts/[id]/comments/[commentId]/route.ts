import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (comment.postId !== params.id) {
    return NextResponse.json({ error: "Comment does not belong to this post" }, { status: 400 });
  }

  // Allow comment author or circle admin/owner
  if (comment.authorId !== userId) {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    const auth = await withCircleAuth(post.circleId, userId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }
  }

  await prisma.comment.delete({ where: { id: params.commentId } });

  // Decrement comment count
  await prisma.post.update({
    where: { id: params.id },
    data: { commentCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
