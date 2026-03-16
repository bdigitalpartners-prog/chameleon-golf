import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { fanOutToCircle } from "@/lib/feed";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { courseId, circleId, score, photos, notes } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { courseId: Number(courseId) },
      select: { courseId: true, courseName: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // If circleId provided, verify membership
    if (circleId) {
      const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }

    const checkin = await prisma.courseCheckIn.create({
      data: {
        userId,
        courseId: Number(courseId),
        circleId: circleId ?? null,
        score: score != null ? Number(score) : null,
        photos: photos ?? [],
        notes: notes ?? null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
      },
    });

    // If shared with circle, fan out to feed
    if (circleId) {
      const scoreText = score ? ` — scored ${score}` : "";
      const post = await prisma.post.create({
        data: {
          authorId: userId,
          circleId,
          courseId: Number(courseId),
          type: "CHECK_IN",
          content: `just played ${course.courseName}${scoreText}`,
          mediaUrls: photos ?? [],
        },
      });

      await fanOutToCircle({
        circleId,
        type: "CHECK_IN",
        actorId: userId,
        postId: post.id,
        courseId: Number(courseId),
        metadata: {
          courseName: course.courseName,
          score: score ?? null,
        },
      });
    }

    return NextResponse.json(checkin, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/checkins error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
