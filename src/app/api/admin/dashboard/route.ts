import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalCourses,
      totalUsers,
      totalRatings,
      todayConcierge,
      recentUsers,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.user.count(),
      prisma.userCourseRating.count(),
      prisma.conciergeUsage.aggregate({
        where: { createdAt: { gte: todayStart } },
        _count: { id: true },
        _sum: { totalCost: true },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      totalCourses,
      totalUsers,
      totalRatings,
      todayConciergeQueries: todayConcierge._count.id,
      todayConciergeCost: Number(todayConcierge._sum.totalCost || 0),
      recentUsers,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
