import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Total ranking entries = proxy for total page views
    const totalViews = await prisma.rankingEntry.count();

    // Unique courses that appear in rankings
    const uniqueCoursesViewed = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT course_id) as count FROM ranking_entries
    `;

    // Most popular course (most ranking entries)
    const mostPopularCourse = await prisma.$queryRaw<
      Array<{ course_name: string; entry_count: bigint }>
    >`
      SELECT c.course_name, COUNT(re.entry_id) as entry_count
      FROM ranking_entries re
      JOIN courses c ON c.course_id = re.course_id
      GROUP BY c.course_name
      ORDER BY entry_count DESC
      LIMIT 1
    `;

    // Most searched state (state with most courses)
    const mostSearchedState = await prisma.$queryRaw<
      Array<{ state: string; count: bigint }>
    >`
      SELECT state, COUNT(*) as count
      FROM courses
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state
      ORDER BY count DESC
      LIMIT 1
    `;

    // Top 20 courses by ranking entry count (for bar chart)
    const topCourses = await prisma.$queryRaw<
      Array<{ course_name: string; entry_count: bigint }>
    >`
      SELECT c.course_name, COUNT(re.entry_id) as entry_count
      FROM ranking_entries re
      JOIN courses c ON c.course_id = re.course_id
      GROUP BY c.course_name
      ORDER BY entry_count DESC
      LIMIT 20
    `;

    // Geographic distribution — states with most courses
    const geographicDistribution = await prisma.$queryRaw<
      Array<{
        state: string;
        course_count: bigint;
        avg_score: number | null;
        top_course: string | null;
      }>
    >`
      SELECT
        c.state,
        COUNT(DISTINCT c.course_id) as course_count,
        AVG(cs.chameleon_score)::float as avg_score,
        (
          SELECT c2.course_name
          FROM courses c2
          LEFT JOIN chameleon_scores cs2 ON cs2.course_id = c2.course_id
          WHERE c2.state = c.state
          ORDER BY cs2.chameleon_score DESC NULLS LAST
          LIMIT 1
        ) as top_course
      FROM courses c
      LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
      WHERE c.state IS NOT NULL AND c.state != ''
      GROUP BY c.state
      ORDER BY course_count DESC
      LIMIT 25
    `;

    return NextResponse.json({
      totalViews,
      uniqueCoursesViewed: Number(uniqueCoursesViewed[0]?.count || 0),
      mostPopularCourse: mostPopularCourse[0]?.course_name || "N/A",
      mostSearchedState: mostSearchedState[0]?.state || "N/A",
      topCourses: topCourses.map((c) => ({
        name: c.course_name,
        views: Number(c.entry_count),
      })),
      geographicDistribution: geographicDistribution.map((g) => ({
        state: g.state,
        courseCount: Number(g.course_count),
        avgScore: g.avg_score ? Number(Number(g.avg_score).toFixed(2)) : null,
        topCourse: g.top_course,
      })),
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics overview" }, { status: 500 });
  }
}
