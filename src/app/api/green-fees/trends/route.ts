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
    // Get fee history grouped by month for charting
    const trends = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
         fee_type,
         amount,
         season,
         effective_date,
         source
       FROM green_fee_history
       WHERE course_id = $1
       ORDER BY effective_date ASC`,
      parseInt(courseId)
    );

    // Get value index for context
    const valueIndex = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM green_fee_value_index WHERE course_id = $1 LIMIT 1`,
      parseInt(courseId)
    );

    // Group trends by fee type for chart series
    const series: Record<string, { date: string; amount: number; season: string }[]> = {};
    for (const t of trends) {
      const key = t.fee_type || "standard_18";
      if (!series[key]) series[key] = [];
      series[key].push({
        date: t.effective_date,
        amount: t.amount,
        season: t.season || "peak",
      });
    }

    return NextResponse.json({
      series,
      valueIndex: valueIndex[0] || null,
      dataPoints: trends.length,
    });
  } catch (err) {
    console.error("Error fetching trends:", err);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
