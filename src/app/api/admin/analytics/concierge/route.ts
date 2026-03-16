import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Top 20 most recent concierge queries
    const recentQueries = await prisma.conciergeUsage.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        messagePreview: true,
        model: true,
        totalCost: true,
      },
    });

    // Daily query count over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT DATE(created_at)::text as date, COUNT(*) as count
      FROM concierge_usage
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Model usage distribution
    const modelUsage = await prisma.$queryRaw<
      Array<{ model: string; count: bigint }>
    >`
      SELECT model, COUNT(*) as count
      FROM concierge_usage
      GROUP BY model
      ORDER BY count DESC
    `;

    return NextResponse.json({
      recentQueries: recentQueries.map((q) => ({
        id: q.id,
        time: q.createdAt.toISOString(),
        messagePreview: q.messagePreview || "—",
        model: q.model,
        cost: Number(q.totalCost),
      })),
      dailyTrends: dailyTrends.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      modelUsage: modelUsage.map((m) => ({
        model: m.model,
        count: Number(m.count),
      })),
    });
  } catch (err) {
    console.error("Concierge analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch concierge analytics" }, { status: 500 });
  }
}
