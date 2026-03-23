import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const minScore = searchParams.get("minScore");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "value_score";

  try {
    let whereClause = "1=1";
    const params: any[] = [];
    let paramIdx = 1;

    if (state) {
      params.push(state);
      whereClause += ` AND c."state" = $${paramIdx++}`;
    }

    if (minScore) {
      params.push(parseInt(minScore));
      whereClause += ` AND gfv.value_score >= $${paramIdx++}`;
    }

    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      whereClause += ` AND gfv.current_avg_fee <= $${paramIdx++}`;
    }

    const orderBy =
      sortBy === "price_low" ? `gfv.current_avg_fee ASC` :
      sortBy === "price_high" ? `gfv.current_avg_fee DESC` :
      `gfv.value_score DESC`;

    params.push(limit);

    const courses = await prisma.$queryRawUnsafe<any[]>(
      `SELECT gfv.*, c."courseName", c."city", c."state", c."country",
              c."courseStyle", c."accessType", c."greenFeeLow", c."greenFeeHigh",
              c."logoUrl", c."originalArchitect"
       FROM green_fee_value_index gfv
       JOIN courses c ON c."courseId" = gfv.course_id
       WHERE ${whereClause}
       ORDER BY ${orderBy} NULLS LAST
       LIMIT $${paramIdx}`,
      ...params
    );

    // Get unique states for filter options
    const states = await prisma.$queryRawUnsafe<any[]>(
      `SELECT DISTINCT c."state" FROM green_fee_value_index gfv
       JOIN courses c ON c."courseId" = gfv.course_id
       WHERE c."state" IS NOT NULL
       ORDER BY c."state"`
    );

    return NextResponse.json({
      courses: courses.map((c: any) => ({
        courseId: c.course_id,
        name: c.courseName,
        location: [c.city, c.state, c.country].filter(Boolean).join(", "),
        style: c.courseStyle,
        accessType: c.accessType,
        greenFee: c.greenFeeLow ? `$${c.greenFeeLow}${c.greenFeeHigh ? `–$${c.greenFeeHigh}` : ""}` : "N/A",
        currentAvgFee: c.current_avg_fee,
        valueScore: c.value_score,
        priceTrend: c.price_trend,
        yoyChangePct: c.yoy_change_pct,
        percentileInState: c.percentile_in_state,
        percentileInTier: c.percentile_in_tier,
        bestValueTime: c.best_value_time,
        logoUrl: c.logoUrl,
        architect: c.originalArchitect,
      })),
      states: states.map((s: any) => s.state),
    });
  } catch (err) {
    console.error("Error fetching value index:", err);
    return NextResponse.json({ error: "Failed to fetch value index" }, { status: 500 });
  }
}
