import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  try {
    const [history, valueIndex, courseInfo] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM green_fee_history
         WHERE course_id = $1
         ORDER BY effective_date DESC
         LIMIT 50`,
        parseInt(courseId)
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM green_fee_value_index
         WHERE course_id = $1
         LIMIT 1`,
        parseInt(courseId)
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "courseId", "courseName", "greenFeeLow", "greenFeeHigh",
                "greenFeePeak", "greenFeeOffPeak", "greenFeeTwilight",
                "state", "country"
         FROM courses WHERE "courseId" = $1 LIMIT 1`,
        parseInt(courseId)
      ),
    ]);

    return NextResponse.json({
      course: courseInfo[0] || null,
      history,
      valueIndex: valueIndex[0] || null,
    });
  } catch (err) {
    console.error("Error fetching green fees:", err);
    return NextResponse.json({ error: "Failed to fetch green fees" }, { status: 500 });
  }
}
