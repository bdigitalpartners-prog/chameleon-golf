import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalCourses, totalUsers, totalScores, totalRatings, enrichedCourses, rankedCourses] =
    await Promise.all([
      prisma.course.count(),
      prisma.user.count(),
      prisma.postedScore.count(),
      prisma.userCourseRating.count(),
      prisma.course.count({ where: { isEnriched: true } }),
      prisma.course.count({ where: { numListsAppeared: { gt: 0 } } }),
    ]);

  return NextResponse.json({
    totalCourses,
    totalUsers,
    totalScores,
    totalRatings,
    enrichedCourses,
    rankedCourses,
  });
}
