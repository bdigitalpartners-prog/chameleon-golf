import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function getDateRange(period: string): { gte: Date } {
  const now = new Date();

  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    case "month": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    case "all":
    default: {
      return { gte: new Date("2020-01-01") };
    }
  }
}

export async function GET(request: NextRequest) {
  // Auth check
  const adminKey = request.headers.get("x-admin-key");
  if (!ADMIN_API_KEY || adminKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";

  const dateRange = getDateRange(period);

  try {
    // Get aggregate stats
    const [aggregate, dailyBreakdown] = await Promise.all([
      prisma.conciergeUsage.aggregate({
        where: { createdAt: dateRange },
        _count: { id: true },
        _sum: { totalCost: true },
        _avg: { totalCost: true },
      }),
      // Get daily breakdown using raw query for grouping by date
      prisma.$queryRaw<Array<{ date: Date | string; queries: bigint; cost: string }>>`
        SELECT
          DATE(created_at) as date,
          COUNT(*)::bigint as queries,
          SUM(total_cost)::text as cost
        FROM concierge_usage
        WHERE created_at >= ${dateRange.gte}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
      `,
    ]);

    return NextResponse.json({
      totalQueries: aggregate._count.id,
      totalCost: Number(aggregate._sum.totalCost || 0),
      avgCostPerQuery: Number(aggregate._avg.totalCost || 0),
      dailyBreakdown: dailyBreakdown.map((row) => ({
        date: row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : String(row.date),
        queries: Number(row.queries),
        cost: Number(row.cost || 0),
      })),
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
