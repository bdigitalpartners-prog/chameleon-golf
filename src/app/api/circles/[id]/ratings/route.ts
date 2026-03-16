import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { recalculateAggregate } from "@/lib/course-aggregates";
import { fanOutToCircle } from "@/lib/feed";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { courseId, overallScore, dimensions, reviewText, playDate } = body;

    if (!courseId || overallScore == null) {
      return NextResponse.json({ error: "courseId and overallScore are required" }, { status: 400 });
    }

    if (overallScore < 1 || overallScore > 10) {
      return NextResponse.json({ error: "overallScore must be between 1 and 10" }, { status: 400 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { courseId: Number(courseId) },
      select: { courseId: true, courseName: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Upsert rating (one rating per user per circle per course)
    const rating = await prisma.circleCourseRating.upsert({
      where: {
        circleId_userId_courseId: { circleId, userId, courseId: Number(courseId) },
      },
      create: {
        circleId,
        userId,
        courseId: Number(courseId),
        overallScore: Number(overallScore),
        dimensions: dimensions ?? undefined,
        reviewText: reviewText ?? null,
        playDate: playDate ? new Date(playDate) : null,
      },
      update: {
        overallScore: Number(overallScore),
        dimensions: dimensions ?? undefined,
        reviewText: reviewText ?? null,
        playDate: playDate ? new Date(playDate) : null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
        circle: { select: { id: true, name: true } },
      },
    });

    // Recalculate aggregate
    await recalculateAggregate(circleId, Number(courseId));

    // Create auto-generated feed post
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        circleId,
        courseId: Number(courseId),
        type: "COURSE_RATING",
        content: `rated ${course.courseName} ${Number(overallScore).toFixed(1)}/10`,
      },
    });

    // Fan out to circle feed
    await fanOutToCircle({
      circleId,
      type: "COURSE_RATING",
      actorId: userId,
      postId: post.id,
      courseId: Number(courseId),
      metadata: {
        overallScore: Number(overallScore),
        courseName: course.courseName,
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/ratings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

    const where: any = { circleId };
    if (courseId) where.courseId = Number(courseId);

    const orderBy: any = sort === "score" ? { overallScore: "desc" } : { createdAt: "desc" };

    const [ratings, total] = await Promise.all([
      prisma.circleCourseRating.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
          course: { select: { courseId: true, courseName: true, city: true, state: true } },
        },
      }),
      prisma.circleCourseRating.count({ where }),
    ]);

    return NextResponse.json({
      ratings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/ratings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
