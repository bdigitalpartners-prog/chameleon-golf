import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/looper-guild/caddies/[id]/rate — submit a rating (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { rating, comment, courseId } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const caddy = await prisma.caddy.findUnique({ where: { id: params.id } });
    if (!caddy || caddy.status !== "APPROVED") {
      return NextResponse.json({ error: "Caddy not found" }, { status: 404 });
    }

    const caddyRating = await prisma.caddyRating.upsert({
      where: {
        caddyId_userId_courseId: {
          caddyId: params.id,
          userId,
          courseId: parseInt(courseId, 10),
        },
      },
      update: {
        rating: parseInt(rating, 10),
        comment: comment?.trim() || null,
      },
      create: {
        caddyId: params.id,
        userId,
        courseId: parseInt(courseId, 10),
        rating: parseInt(rating, 10),
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, rating: caddyRating }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/looper-guild/caddies/[id]/rate error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
