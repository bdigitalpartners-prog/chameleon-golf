import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — Admin import tournament data (accepts JSON array)
export async function POST(req: NextRequest) {
  // Verify admin API key
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tournaments } = await req.json();

    if (!Array.isArray(tournaments) || tournaments.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty tournaments array" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const t of tournaments) {
      if (!t.course_id || !t.tournament_name || !t.year) {
        errors.push(`Missing required fields for: ${t.tournament_name ?? "unknown"}`);
        skipped++;
        continue;
      }

      try {
        await prisma.$queryRawUnsafe(
          `INSERT INTO course_tournaments (course_id, tournament_name, tour, year, winner_name, winner_score, runner_up, winning_purse, total_purse, notable_moments, data_source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (course_id, tournament_name, year) DO UPDATE SET
             winner_name = EXCLUDED.winner_name,
             winner_score = EXCLUDED.winner_score,
             runner_up = EXCLUDED.runner_up,
             winning_purse = EXCLUDED.winning_purse,
             total_purse = EXCLUDED.total_purse,
             notable_moments = EXCLUDED.notable_moments,
             data_source = EXCLUDED.data_source`,
          t.course_id,
          t.tournament_name,
          t.tour ?? null,
          t.year,
          t.winner_name ?? null,
          t.winner_score ?? null,
          t.runner_up ?? null,
          t.winning_purse ?? null,
          t.total_purse ?? null,
          t.notable_moments ?? null,
          t.data_source ?? "manual"
        );
        imported++;
      } catch (err: any) {
        errors.push(`Failed to import ${t.tournament_name} (${t.year}): ${err.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Tournament import error:", error);
    return NextResponse.json(
      { error: "Failed to import tournaments", detail: error.message },
      { status: 500 }
    );
  }
}
