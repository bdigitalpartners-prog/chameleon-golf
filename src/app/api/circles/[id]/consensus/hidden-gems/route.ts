import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

/**
 * GET — Hidden gems: courses rated >7.5 by circle but not in any national top-100 list
 */
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
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

    // Get circle aggregates with high scores
    const highRated = await prisma.circleCourseAggregate.findMany({
      where: { circleId, avgScore: { gte: 7.5 } },
      orderBy: { avgScore: "desc" },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            city: true,
            state: true,
            accessType: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    // Filter out courses that appear in national top-100 lists
    const courseIds = highRated.map((a) => a.courseId);

    const rankedCourseIds = new Set(
      (
        await prisma.rankingEntry.findMany({
          where: { courseId: { in: courseIds }, rankPosition: { lte: 100, gt: 0 } },
          select: { courseId: true },
          distinct: ["courseId"],
        })
      ).map((r) => r.courseId)
    );

    const gems = highRated.filter((a) => !rankedCourseIds.has(a.courseId));
    const total = gems.length;
    const paginated = gems.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      hiddenGems: paginated.map((agg) => ({
        courseId: agg.courseId,
        course: agg.course,
        circleAvgScore: agg.avgScore,
        ratingCount: agg.ratingCount,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/consensus/hidden-gems error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
