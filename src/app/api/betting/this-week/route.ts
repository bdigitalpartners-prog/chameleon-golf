import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get a featured course profile for "this week" — in production, this would
    // be keyed to the current PGA Tour schedule. For now, return the first profile
    // with full data available.
    const profiles = await prisma.$queryRawUnsafe(
      `SELECT dp.*, c.id as cid, c.name as course_name, c.city, c.state,
              c."mainImageUrl" as image_url
       FROM "course_dfs_profile" dp
       JOIN "Course" c ON c.id = dp.course_id
       ORDER BY dp.updated_at DESC
       LIMIT 1`
    ) as any[];

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ thisWeek: null });
    }

    const p = profiles[0];

    // Get latest year stats
    const stats = await prisma.$queryRawUnsafe(
      `SELECT stat_type, stat_value, year
       FROM "course_betting_data"
       WHERE course_id = $1
       ORDER BY year DESC
       LIMIT 6`,
      p.course_id
    ) as any[];

    let correlations: string[] = [];
    try {
      correlations = p.course_correlation ? JSON.parse(p.course_correlation) : [];
    } catch {
      correlations = [];
    }

    return NextResponse.json({
      thisWeek: {
        courseId: p.course_id,
        courseName: p.course_name,
        city: p.city,
        state: p.state,
        imageUrl: p.image_url,
        courseType: p.course_type,
        keyStat: p.key_stat,
        historicalCutLine: p.historical_cut_line,
        typicalWinningScore: p.typical_winning_score,
        notes: p.notes,
        correlations,
        latestStats: stats.map((s: any) => ({
          statType: s.stat_type,
          value: s.stat_value,
          year: s.year,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching this week:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
