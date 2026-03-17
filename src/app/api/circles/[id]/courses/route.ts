import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

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
    const sort = searchParams.get("sort") ?? "score";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

    const orderBy: any = sort === "recent" ? { lastUpdated: "desc" } : { avgScore: "desc" };

    const [aggregates, total] = await Promise.all([
      prisma.circleCourseAggregate.findMany({
        where: { circleId },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.circleCourseAggregate.count({ where: { circleId } }),
    ]);

    // Get top rater avatars for each course
    const enriched = await Promise.all(
      aggregates.map(async (agg) => {
        const topRaters = await prisma.circleCourseRating.findMany({
          where: { circleId, courseId: agg.courseId },
          orderBy: { overallScore: "desc" },
          take: 3,
          select: {
            user: { select: { id: true, name: true, image: true } },
          },
        });
        return {
          ...agg,
          topRaters: topRaters.map((r) => r.user),
        };
      })
    );

    return NextResponse.json({
      courses: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/courses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
