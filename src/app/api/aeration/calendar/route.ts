import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Calendar view of aerations
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const month = searchParams.get("month"); // YYYY-MM format
  const state = searchParams.get("state");

  // Default to current month if not specified
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, mon] = targetMonth.split("-").map(Number);
  const startOfMonth = `${year}-${String(mon).padStart(2, "0")}-01`;
  const endOfMonth = new Date(year, mon, 0);
  const endStr = `${year}-${String(mon).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`;

  try {
    let whereConditions = [
      `(ca.start_date <= $2 AND (ca.end_date >= $1 OR ca.end_date IS NULL))`,
    ];
    const params: any[] = [startOfMonth, endStr];

    if (state) {
      params.push(state);
      whereConditions.push(`c."state" = $${params.length}`);
    }

    const aerations = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ca.*,
              c."courseName" as course_name,
              c."city", c."state"
       FROM course_aeration ca
       LEFT JOIN courses c ON c."courseId" = ca.course_id
       WHERE ${whereConditions.join(" AND ")}
       ORDER BY ca.start_date ASC`,
      ...params
    );

    return NextResponse.json({
      month: targetMonth,
      aerations,
      count: aerations.length,
    });
  } catch (error) {
    console.error("GET /api/aeration/calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch aeration calendar" },
      { status: 500 }
    );
  }
}
