import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — Admin batch calculate/upsert DNA scores
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { profiles } = await req.json();

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty profiles array" },
        { status: 400 }
      );
    }

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const p of profiles) {
      if (!p.course_id) {
        errors.push(`Missing course_id for profile`);
        skipped++;
        continue;
      }

      try {
        await prisma.$queryRawUnsafe(
          `INSERT INTO course_dna (
            course_id, shot_variety, strategic_options, visual_drama,
            green_complexity, bunker_challenge, water_influence, elevation_change,
            wind_exposure, recovery_difficulty, length_challenge, walkability_score,
            conditioning_standard, data_sources, confidence_score, last_calculated, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          ON CONFLICT (course_id) DO UPDATE SET
            shot_variety = EXCLUDED.shot_variety,
            strategic_options = EXCLUDED.strategic_options,
            visual_drama = EXCLUDED.visual_drama,
            green_complexity = EXCLUDED.green_complexity,
            bunker_challenge = EXCLUDED.bunker_challenge,
            water_influence = EXCLUDED.water_influence,
            elevation_change = EXCLUDED.elevation_change,
            wind_exposure = EXCLUDED.wind_exposure,
            recovery_difficulty = EXCLUDED.recovery_difficulty,
            length_challenge = EXCLUDED.length_challenge,
            walkability_score = EXCLUDED.walkability_score,
            conditioning_standard = EXCLUDED.conditioning_standard,
            data_sources = EXCLUDED.data_sources,
            confidence_score = EXCLUDED.confidence_score,
            last_calculated = NOW(),
            updated_at = NOW()`,
          p.course_id,
          p.shot_variety ?? 50,
          p.strategic_options ?? 50,
          p.visual_drama ?? 50,
          p.green_complexity ?? 50,
          p.bunker_challenge ?? 50,
          p.water_influence ?? 50,
          p.elevation_change ?? 50,
          p.wind_exposure ?? 50,
          p.recovery_difficulty ?? 50,
          p.length_challenge ?? 50,
          p.walkability_score ?? 50,
          p.conditioning_standard ?? 50,
          p.data_sources ? JSON.stringify(p.data_sources) : '["manual"]',
          p.confidence_score ?? 0.7
        );
        processed++;
      } catch (err: any) {
        errors.push(`Failed for course_id ${p.course_id}: ${err.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Course DNA calculate error:", error);
    return NextResponse.json(
      { error: "Failed to calculate DNA", detail: error.message },
      { status: 500 }
    );
  }
}
