import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Currently aerated courses
export async function GET(req: NextRequest) {
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") ?? 50),
    200
  );

  try {
    const active = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ca.*,
              c."courseName" as course_name,
              c."city", c."state",
              c."latitude", c."longitude",
              c."courseStyle"
       FROM course_aeration ca
       LEFT JOIN courses c ON c."courseId" = ca.course_id
       WHERE ca.start_date <= CURRENT_DATE
         AND (ca.end_date >= CURRENT_DATE OR ca.end_date IS NULL)
         AND (ca.start_date + INTERVAL '1 week' * COALESCE(ca.recovery_weeks, 4)) >= CURRENT_DATE
       ORDER BY ca.start_date DESC
       LIMIT $1`,
      limit
    );

    return NextResponse.json({ active, count: active.length });
  } catch (error) {
    console.error("GET /api/aeration/active error:", error);
    return NextResponse.json(
      { error: "Failed to fetch active aerations" },
      { status: 500 }
    );
  }
}
