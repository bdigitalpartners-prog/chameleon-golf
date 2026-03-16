import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Most listed courses — top 20 by num_lists_appeared
    const mostListed = await prisma.$queryRaw<
      Array<{
        course_name: string;
        num_lists_appeared: number;
        best_rank: number | null;
        chameleon_score: number | null;
      }>
    >`
      SELECT
        c.course_name,
        c.num_lists_appeared,
        (
          SELECT MIN(re.rank_position)
          FROM ranking_entries re
          WHERE re.course_id = c.course_id AND re.rank_position IS NOT NULL
        ) as best_rank,
        cs.chameleon_score::float as chameleon_score
      FROM courses c
      LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
      WHERE c.num_lists_appeared IS NOT NULL AND c.num_lists_appeared > 0
      ORDER BY c.num_lists_appeared DESC
      LIMIT 20
    `;

    // Course type breakdown
    const courseTypes = await prisma.$queryRaw<
      Array<{ course_type: string | null; count: bigint }>
    >`
      SELECT course_type, COUNT(*) as count
      FROM courses
      GROUP BY course_type
      ORDER BY count DESC
    `;

    // Access type breakdown
    const accessTypes = await prisma.$queryRaw<
      Array<{ access_type: string | null; count: bigint }>
    >`
      SELECT access_type, COUNT(*) as count
      FROM courses
      GROUP BY access_type
      ORDER BY count DESC
    `;

    // Price distribution (bucket by $50 increments using green_fee_high)
    const priceDistribution = await prisma.$queryRaw<
      Array<{ bucket: string; count: bigint }>
    >`
      SELECT
        CASE
          WHEN green_fee_high IS NULL THEN 'Unknown'
          WHEN green_fee_high < 50 THEN '$0-49'
          WHEN green_fee_high < 100 THEN '$50-99'
          WHEN green_fee_high < 150 THEN '$100-149'
          WHEN green_fee_high < 200 THEN '$150-199'
          WHEN green_fee_high < 250 THEN '$200-249'
          WHEN green_fee_high < 300 THEN '$250-299'
          WHEN green_fee_high < 400 THEN '$300-399'
          WHEN green_fee_high < 500 THEN '$400-499'
          ELSE '$500+'
        END as bucket,
        COUNT(*) as count
      FROM courses
      GROUP BY bucket
      ORDER BY
        CASE bucket
          WHEN '$0-49' THEN 1
          WHEN '$50-99' THEN 2
          WHEN '$100-149' THEN 3
          WHEN '$150-199' THEN 4
          WHEN '$200-249' THEN 5
          WHEN '$250-299' THEN 6
          WHEN '$300-399' THEN 7
          WHEN '$400-499' THEN 8
          WHEN '$500+' THEN 9
          ELSE 10
        END
    `;

    return NextResponse.json({
      mostListed: mostListed.map((c) => ({
        name: c.course_name,
        listsAppeared: c.num_lists_appeared,
        bestRank: c.best_rank,
        chameleonScore: c.chameleon_score ? Number(Number(c.chameleon_score).toFixed(2)) : null,
      })),
      courseTypes: courseTypes.map((t) => ({
        type: t.course_type || "Unknown",
        count: Number(t.count),
      })),
      accessTypes: accessTypes.map((t) => ({
        type: t.access_type || "Unknown",
        count: Number(t.count),
      })),
      priceDistribution: priceDistribution.map((p) => ({
        bucket: p.bucket,
        count: Number(p.count),
      })),
    });
  } catch (err) {
    console.error("Course analytics error:", err);
    return NextResponse.json({ error: "Failed to fetch course analytics" }, { status: 500 });
  }
}
