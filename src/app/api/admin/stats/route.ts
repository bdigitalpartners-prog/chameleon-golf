import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const keyParam = req.nextUrl.searchParams.get("key");
  if (keyParam && keyParam === ADMIN_KEY) return true;
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === "admin";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalCourses,
    enrichedCourses,
    rankedCourses,
    totalUsers,
    totalScores,
    totalRatings,
    totalRankings,
    withDescription,
    withGreenFees,
    withCoordinates,
    withPhotos,
    withInsiderTips,
    mediaCoverage,
    pendingVerifications,
    scoreDistribution,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { isEnriched: true } }),
    prisma.course.count({ where: { numListsAppeared: { gt: 0 } } }),
    prisma.user.count(),
    prisma.postedScore.count(),
    prisma.userCourseRating.count(),
    prisma.rankingEntry.count(),
    prisma.course.count({ where: { description: { not: null } } }),
    prisma.course.count({ where: { greenFeeHigh: { not: null } } }),
    prisma.course.count({ where: { latitude: { not: null }, longitude: { not: null } } }),
    prisma.course.count({
      where: { media: { some: {} } },
    }),
    prisma.course.count({ where: { insiderTips: { not: Prisma.DbNull } } }),
    prisma.courseMedia.count(),
    prisma.adminVerificationQueue.count({ where: { status: "pending" } }),
    // Score distribution by tier using raw SQL
    prisma.$queryRaw<Array<{ tier: string; count: bigint }>>`
      SELECT
        CASE
          WHEN cs.chameleon_score >= 90 THEN 'elite'
          WHEN cs.chameleon_score >= 70 THEN 'excellent'
          WHEN cs.chameleon_score >= 50 THEN 'strong'
          WHEN cs.chameleon_score >= 30 THEN 'good'
          WHEN cs.chameleon_score > 0 THEN 'ranked'
          ELSE 'unranked'
        END AS tier,
        COUNT(*)::bigint AS count
      FROM chameleon_scores cs
      GROUP BY tier
      ORDER BY MIN(cs.chameleon_score) DESC
    `,
  ]);

  const scoreDist: Record<string, number> = {
    elite: 0,
    excellent: 0,
    strong: 0,
    good: 0,
    ranked: 0,
    unranked: 0,
  };
  for (const row of scoreDistribution) {
    scoreDist[row.tier] = Number(row.count);
  }

  return NextResponse.json({
    totalCourses,
    enrichedCourses,
    enrichedPct: totalCourses > 0 ? Math.round((enrichedCourses / totalCourses) * 100) : 0,
    rankedCourses,
    totalUsers,
    totalScores,
    totalRatings,
    totalRankings,
    mediaCoverage,
    pendingVerifications,
    scoreDistribution: scoreDist,
    dataCompleteness: {
      descriptions: totalCourses > 0 ? Math.round((withDescription / totalCourses) * 100) : 0,
      greenFees: totalCourses > 0 ? Math.round((withGreenFees / totalCourses) * 100) : 0,
      coordinates: totalCourses > 0 ? Math.round((withCoordinates / totalCourses) * 100) : 0,
      photos: totalCourses > 0 ? Math.round((withPhotos / totalCourses) * 100) : 0,
      insiderTips: totalCourses > 0 ? Math.round((withInsiderTips / totalCourses) * 100) : 0,
    },
  });
}
