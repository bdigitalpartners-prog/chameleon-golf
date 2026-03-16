import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const [topRated, ratingDistribution, mostActive, monthlyActivity] = await Promise.all([
      // Top 20 courses by avg overall rating (min 3 ratings)
      prisma.$queryRaw<Array<{ course_id: number; course_name: string; avg_rating: string; count: bigint }>>`
        SELECT c.course_id, c.course_name,
               AVG(r.overall_rating)::text as avg_rating,
               COUNT(*)::bigint as count
        FROM user_course_ratings r
        JOIN courses c ON r.course_id = c.course_id
        GROUP BY c.course_id, c.course_name
        HAVING COUNT(*) >= 3
        ORDER BY AVG(r.overall_rating) DESC
        LIMIT 20
      `,
      // Rating distribution (1-10)
      prisma.$queryRaw<Array<{ rating: number; count: bigint }>>`
        SELECT FLOOR(overall_rating)::int as rating, COUNT(*)::bigint as count
        FROM user_course_ratings
        GROUP BY FLOOR(overall_rating)
        ORDER BY rating
      `,
      // Top 10 most active reviewers
      prisma.$queryRaw<Array<{ user_id: string; name: string; count: bigint }>>`
        SELECT u.id as user_id, u.name,
               COUNT(*)::bigint as count
        FROM user_course_ratings r
        JOIN users u ON r.user_id = u.id
        GROUP BY u.id, u.name
        ORDER BY count DESC
        LIMIT 10
      `,
      // Monthly activity (last 12 months)
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
               COUNT(*)::bigint as count
        FROM user_course_ratings
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `,
    ]);

    return NextResponse.json({
      topRated: topRated.map((r) => ({
        courseId: Number(r.course_id),
        courseName: r.course_name,
        avgRating: Number(Number(r.avg_rating).toFixed(1)),
        ratingsCount: Number(r.count),
      })),
      ratingDistribution: ratingDistribution.map((r) => ({
        rating: r.rating,
        count: Number(r.count),
      })),
      mostActive: mostActive.map((r) => ({
        userId: r.user_id,
        name: r.name || "Anonymous",
        ratingsCount: Number(r.count),
      })),
      monthlyActivity: monthlyActivity.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
    });
  } catch (err) {
    console.error("Reviews analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
