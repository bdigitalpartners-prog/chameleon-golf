import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();

    // New users (7 days, 30 days)
    const newUsers7d = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const newUsers30d = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Active users (have lastLoginAt in period) - fallback to isActive
    const activeUsers7d = await prisma.user.count({
      where: {
        OR: [
          { lastLoginAt: { gte: sevenDaysAgo } },
          { updatedAt: { gte: sevenDaysAgo }, isActive: true },
        ],
      },
    });
    const activeUsers30d = await prisma.user.count({
      where: {
        OR: [
          { lastLoginAt: { gte: thirtyDaysAgo } },
          { updatedAt: { gte: thirtyDaysAgo }, isActive: true },
        ],
      },
    });

    // Users by role
    const roleBreakdown = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // Users by status
    const statusBreakdown = await prisma.user.groupBy({
      by: ["status"],
      _count: true,
    });

    // Signup trend (last 30 days) - get daily counts
    const signupTrend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.user.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });
      signupTrend.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    return NextResponse.json({
      totalUsers,
      newUsers7d,
      newUsers30d,
      activeUsers7d,
      activeUsers30d,
      roleBreakdown: roleBreakdown.map((r) => ({
        role: r.role,
        count: r._count,
      })),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      signupTrend,
    });
  } catch (err) {
    console.error("User analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
