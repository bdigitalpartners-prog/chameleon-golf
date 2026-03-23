import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { profiles, stats } = body;

    let profileCount = 0;
    let statsCount = 0;

    if (profiles && Array.isArray(profiles)) {
      for (const p of profiles) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "course_dfs_profile" (course_id, course_type, key_stat, historical_cut_line, typical_winning_score, course_correlation, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (course_id) DO UPDATE SET
             course_type = EXCLUDED.course_type,
             key_stat = EXCLUDED.key_stat,
             historical_cut_line = EXCLUDED.historical_cut_line,
             typical_winning_score = EXCLUDED.typical_winning_score,
             course_correlation = EXCLUDED.course_correlation,
             notes = EXCLUDED.notes,
             updated_at = CURRENT_TIMESTAMP`,
          p.courseId,
          p.courseType,
          p.keyStat,
          p.historicalCutLine || null,
          p.typicalWinningScore || null,
          p.correlations ? JSON.stringify(p.correlations) : null,
          p.notes || null
        );
        profileCount++;
      }
    }

    if (stats && Array.isArray(stats)) {
      for (const s of stats) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "course_betting_data" (course_id, stat_type, stat_value, tour, year, rounds_played, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          s.courseId,
          s.statType,
          s.statValue,
          s.tour || "PGA Tour",
          s.year,
          s.roundsPlayed || null,
          s.source || "admin_import"
        );
        statsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: { profiles: profileCount, stats: statsCount },
    });
  } catch (error) {
    console.error("Error importing betting data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
