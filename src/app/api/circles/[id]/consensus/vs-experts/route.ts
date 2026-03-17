import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

/**
 * GET — Circle vs Experts: side-by-side circle ratings vs national rankings
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
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

    // Get circle's rated courses with aggregates
    const [aggregates, total] = await Promise.all([
      prisma.circleCourseAggregate.findMany({
        where: { circleId },
        orderBy: { avgScore: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              city: true,
              state: true,
            },
          },
        },
      }),
      prisma.circleCourseAggregate.count({ where: { circleId } }),
    ]);

    const courseIds = aggregates.map((a) => a.courseId);

    // Get Chameleon Scores (which contain expert rankings)
    const chameleonScores = await prisma.chameleonScore.findMany({
      where: { courseId: { in: courseIds } },
    });
    const scoreMap = new Map(chameleonScores.map((s) => [s.courseId, s]));

    const comparisons = aggregates.map((agg) => {
      const score = scoreMap.get(agg.courseId);
      const circleRating = agg.avgScore;
      const nationalScore = score ? Number(score.chameleonScore) / 10 : null;

      return {
        courseId: agg.courseId,
        course: agg.course,
        circleRating: Math.round(circleRating * 10) / 10,
        ratingCount: agg.ratingCount,
        nationalScore: nationalScore !== null ? Math.round(nationalScore * 10) / 10 : null,
        golfDigestRank: score?.bestRankGolfDigest ?? null,
        golfweekRank: score?.bestRankGolfweek ?? null,
        golfMagRank: score?.bestRankGolfMag ?? null,
        divergence: nationalScore !== null ? Math.round((circleRating - nationalScore) * 10) / 10 : null,
      };
    });

    // Sort by absolute divergence (biggest disagreements first)
    comparisons.sort((a, b) => {
      const absA = Math.abs(a.divergence ?? 0);
      const absB = Math.abs(b.divergence ?? 0);
      return absB - absA;
    });

    return NextResponse.json({
      comparisons,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/consensus/vs-experts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
