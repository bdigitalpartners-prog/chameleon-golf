import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

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
        orderBy: { createdAt: "desc" },
        take: 10,
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
