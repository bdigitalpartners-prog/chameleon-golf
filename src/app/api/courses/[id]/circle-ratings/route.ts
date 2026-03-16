import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const courseId = Number(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    // Get all circles the user belongs to
    const memberships = await prisma.circleMembership.findMany({
      where: {
        userId,
        role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      },
      select: { circleId: true },
    });

    const circleIds = memberships.map((m) => m.circleId);

    if (circleIds.length === 0) {
      return NextResponse.json({ aggregates: [] });
    }

    // Get aggregates for this course across user's circles
    const aggregates = await prisma.circleCourseAggregate.findMany({
      where: {
        courseId,
        circleId: { in: circleIds },
      },
      include: {
        circle: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { avgScore: "desc" },
    });

    // Also get user's own ratings for this course
    const userRatings = await prisma.circleCourseRating.findMany({
      where: {
        userId,
        courseId,
        circleId: { in: circleIds },
      },
      select: { circleId: true, overallScore: true },
    });

    const userRatingMap = new Map(userRatings.map((r) => [r.circleId, r.overallScore]));

    // Include circles without ratings too (so user can rate)
    const circlesWithData = await prisma.circle.findMany({
      where: { id: { in: circleIds } },
      select: { id: true, name: true, avatarUrl: true },
    });

    const aggMap = new Map(aggregates.map((a) => [a.circleId, a]));

    const result = circlesWithData.map((circle) => ({
      circle,
      aggregate: aggMap.get(circle.id) ?? null,
      userRating: userRatingMap.get(circle.id) ?? null,
    }));

    return NextResponse.json({ circleRatings: result });
  } catch (error: any) {
    console.error("GET /api/courses/[id]/circle-ratings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
