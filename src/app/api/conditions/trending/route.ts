import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Courses with most recent condition reports
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const days = Math.min(Number(searchParams.get("days") ?? 7), 30);
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const trending = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
         cc.course_id,
         c."courseName" as course_name,
         c."city", c."state", c."courseStyle",
         COUNT(*)::int as report_count,
         ROUND(AVG(cc.overall_rating)::numeric, 1) as avg_rating,
         MAX(cc.reported_at) as latest_report
       FROM course_conditions cc
       LEFT JOIN courses c ON c."courseId" = cc.course_id
       WHERE cc.reported_at >= $1
       GROUP BY cc.course_id, c."courseName", c."city", c."state", c."courseStyle"
       ORDER BY report_count DESC, latest_report DESC
       LIMIT $2`,
      since.toISOString(),
      limit
    );

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("GET /api/conditions/trending error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending conditions" },
      { status: 500 }
    );
  }
}
