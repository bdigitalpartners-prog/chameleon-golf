import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  try {
    const profile = await prisma.$queryRawUnsafe(
      `SELECT dp.*, c.name as course_name, c.city, c.state, c."mainImageUrl" as image_url
       FROM "course_dfs_profile" dp
       JOIN "Course" c ON c.id = dp.course_id
       WHERE dp.course_id = $1`,
      Number(courseId)
    ) as any[];

    if (!profile || profile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const row = profile[0];

    // Get latest stats
    const stats = await prisma.$queryRawUnsafe(
      `SELECT stat_type, stat_value, year, rounds_played
       FROM "course_betting_data"
       WHERE course_id = $1
       ORDER BY year DESC, stat_type`,
      Number(courseId)
    ) as any[];

    // Parse correlations
    let correlations: string[] = [];
    try {
      correlations = row.course_correlation ? JSON.parse(row.course_correlation) : [];
    } catch {
      correlations = [];
    }

    // Get correlated course details
    let correlatedCourses: any[] = [];
    if (correlations.length > 0) {
      const placeholders = correlations.map((_: string, i: number) => `$${i + 1}`).join(",");
      const likeClauses = correlations.map((_: string, i: number) => `c.name ILIKE $${i + 1}`).join(" OR ");
      correlatedCourses = await prisma.$queryRawUnsafe(
        `SELECT c.id, c.name, c.city, c.state, c."mainImageUrl" as image_url,
                dp.course_type, dp.key_stat
         FROM "Course" c
         LEFT JOIN "course_dfs_profile" dp ON dp.course_id = c.id
         WHERE ${likeClauses}
         LIMIT 10`,
        ...correlations.map((n: string) => `%${n}%`)
      ) as any[];
    }

    return NextResponse.json({
      profile: {
        courseId: row.course_id,
        courseName: row.course_name,
        city: row.city,
        state: row.state,
        imageUrl: row.image_url,
        courseType: row.course_type,
        keyStat: row.key_stat,
        historicalCutLine: row.historical_cut_line,
        typicalWinningScore: row.typical_winning_score,
        notes: row.notes,
      },
      stats,
      correlatedCourses: correlatedCourses.map((c: any) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        state: c.state,
        imageUrl: c.image_url,
        courseType: c.course_type,
        keyStat: c.key_stat,
      })),
    });
  } catch (error) {
    console.error("Error fetching betting profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
