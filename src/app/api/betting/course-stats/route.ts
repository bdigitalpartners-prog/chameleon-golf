import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const year = req.nextUrl.searchParams.get("year");

  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  try {
    let query = `
      SELECT bd.stat_type, bd.stat_value, bd.year, bd.rounds_played, bd.tour,
             c.name as course_name
      FROM "course_betting_data" bd
      JOIN "Course" c ON c.id = bd.course_id
      WHERE bd.course_id = $1
    `;
    const params: any[] = [Number(courseId)];

    if (year) {
      query += ` AND bd.year = $2`;
      params.push(Number(year));
    }

    query += ` ORDER BY bd.year DESC, bd.stat_type`;

    const stats = await prisma.$queryRawUnsafe(query, ...params) as any[];

    // Group by year
    const byYear: Record<number, any[]> = {};
    for (const s of stats) {
      const y = s.year;
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push({
        statType: s.stat_type,
        value: s.stat_value,
        roundsPlayed: s.rounds_played,
        tour: s.tour,
      });
    }

    return NextResponse.json({
      courseId: Number(courseId),
      courseName: stats[0]?.course_name || null,
      statsByYear: byYear,
    });
  } catch (error) {
    console.error("Error fetching course stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
