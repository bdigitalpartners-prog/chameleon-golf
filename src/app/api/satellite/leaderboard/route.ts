import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_METRICS: Record<string, { column: string; label: string; order: string }> = {
  bunker_count: { column: "sf.bunker_count", label: "Most Bunkered", order: "DESC" },
  water_coverage: { column: "sf.water_coverage_pct", label: "Highest Water Coverage", order: "DESC" },
  tree_coverage: { column: "sf.tree_coverage_pct", label: "Most Tree-Lined", order: "DESC" },
  elevation: { column: "sf.elevation_range_ft", label: "Greatest Elevation Change", order: "DESC" },
  acreage: { column: "sf.total_acreage", label: "Largest Courses", order: "DESC" },
  bunker_pct: { column: "sf.bunker_coverage_pct", label: "Highest Bunker Coverage", order: "DESC" },
};

export async function GET(req: NextRequest) {
  const metric = req.nextUrl.searchParams.get("metric") || "bunker_count";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 20), 50);

  const metricConfig = VALID_METRICS[metric];
  if (!metricConfig) {
    return NextResponse.json(
      { error: `Invalid metric. Valid: ${Object.keys(VALID_METRICS).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const results = await prisma.$queryRawUnsafe(
      `SELECT sf.*, c.name as course_name, c.city, c.state, c."mainImageUrl" as image_url
       FROM "course_satellite_features" sf
       JOIN "Course" c ON c.id = sf.course_id
       WHERE ${metricConfig.column} IS NOT NULL
       ORDER BY ${metricConfig.column} ${metricConfig.order}
       LIMIT $1`,
      limit
    ) as any[];

    return NextResponse.json({
      metric,
      label: metricConfig.label,
      leaderboard: results.map((r: any, i: number) => ({
        rank: i + 1,
        courseId: r.course_id,
        courseName: r.course_name,
        city: r.city,
        state: r.state,
        imageUrl: r.image_url,
        value: r[metric === "water_coverage" ? "water_coverage_pct" :
               metric === "tree_coverage" ? "tree_coverage_pct" :
               metric === "elevation" ? "elevation_range_ft" :
               metric === "acreage" ? "total_acreage" :
               metric === "bunker_pct" ? "bunker_coverage_pct" :
               "bunker_count"],
        totalAcreage: r.total_acreage,
        bunkerCount: r.bunker_count,
        waterCoveragePct: r.water_coverage_pct,
        treeCoveragePct: r.tree_coverage_pct,
        elevationRangeFt: r.elevation_range_ft,
      })),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
