import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DNA_DIMENSIONS = [
  "shot_variety", "strategic_options", "visual_drama", "green_complexity",
  "bunker_challenge", "water_influence", "elevation_change", "wind_exposure",
  "recovery_difficulty", "length_challenge", "walkability_score", "conditioning_standard",
] as const;

const DIMENSION_LABELS: Record<string, string> = {
  shot_variety: "Shot Variety", strategic_options: "Strategic Options",
  visual_drama: "Visual Drama", green_complexity: "Green Complexity",
  bunker_challenge: "Bunker Challenge", water_influence: "Water Influence",
  elevation_change: "Elevation Change", wind_exposure: "Wind Exposure",
  recovery_difficulty: "Recovery Difficulty", length_challenge: "Length Challenge",
  walkability_score: "Walkability", conditioning_standard: "Conditioning Standard",
};

// GET — Compare DNA profiles for up to 4 courses
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json(
      { error: "ids parameter is required (comma-separated course IDs)" },
      { status: 400 }
    );
  }

  const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n)).slice(0, 4);

  if (ids.length < 2) {
    return NextResponse.json(
      { error: "At least 2 course IDs are required for comparison" },
      { status: 400 }
    );
  }

  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cd.*,
              c."courseName" as course_name,
              c."city", c."state"
       FROM course_dna cd
       LEFT JOIN courses c ON c."courseId" = cd.course_id
       WHERE cd.course_id IN (${placeholders})`,
      ...ids
    );

    const courses = results.map((dna) => ({
      courseId: dna.course_id,
      courseName: dna.course_name,
      city: dna.city,
      state: dna.state,
      dimensions: DNA_DIMENSIONS.map((key) => ({
        key,
        label: DIMENSION_LABELS[key],
        value: dna[key] ?? 0,
      })),
    }));

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Course DNA compare error:", error);
    return NextResponse.json(
      { error: "Failed to compare course DNA", detail: error.message },
      { status: 500 }
    );
  }
}
