import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DNA_DIMENSIONS = [
  "shot_variety",
  "strategic_options",
  "visual_drama",
  "green_complexity",
  "bunker_challenge",
  "water_influence",
  "elevation_change",
  "wind_exposure",
  "recovery_difficulty",
  "length_challenge",
  "walkability_score",
  "conditioning_standard",
] as const;

const DIMENSION_LABELS: Record<string, string> = {
  shot_variety: "Shot Variety",
  strategic_options: "Strategic Options",
  visual_drama: "Visual Drama",
  green_complexity: "Green Complexity",
  bunker_challenge: "Bunker Challenge",
  water_influence: "Water Influence",
  elevation_change: "Elevation Change",
  wind_exposure: "Wind Exposure",
  recovery_difficulty: "Recovery Difficulty",
  length_challenge: "Length Challenge",
  walkability_score: "Walkability",
  conditioning_standard: "Conditioning Standard",
};

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  shot_variety: "Range of shots required — fades, draws, punch shots, flops. Higher means more variety demanded.",
  strategic_options: "Number of ways to play each hole. Risk/reward choices, multiple lines off the tee.",
  visual_drama: "Scenic beauty, dramatic vistas, memorable views. Courses that photograph well score high.",
  green_complexity: "Undulation, slopes, tiers, and false fronts on putting surfaces. Higher = more demanding reads.",
  bunker_challenge: "Number, depth, placement, and penal nature of bunkers. High scores mean sand is a serious factor.",
  water_influence: "How much water hazards come into play. Ocean, lakes, creeks affecting strategy.",
  elevation_change: "Vertical movement across the routing. Mountain courses score highest.",
  wind_exposure: "How exposed the course is to wind. Links courses and coastal tracks score highest.",
  recovery_difficulty: "Penalty for missed shots. Tight lies around greens, thick rough, OB proximity.",
  length_challenge: "Raw yardage demands. Longer courses from the tips score higher.",
  walkability_score: "How pleasant the course is to walk. Flat, compact routing = high. Hilly, spread out = low.",
  conditioning_standard: "Turf quality, green speed, overall maintenance level. Private clubs typically score highest.",
};

// GET — Get DNA fingerprint for a course
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cd.*,
              c."courseName" as course_name,
              c."city", c."state", c."courseId" as cid
       FROM course_dna cd
       LEFT JOIN courses c ON c."courseId" = cd.course_id
       WHERE cd.course_id = $1`,
      Number(courseId)
    );

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No DNA profile found for this course" },
        { status: 404 }
      );
    }

    const dna = results[0];
    const dimensions = DNA_DIMENSIONS.map((key) => ({
      key,
      label: DIMENSION_LABELS[key],
      value: dna[key] ?? 0,
      description: DIMENSION_DESCRIPTIONS[key],
    }));

    return NextResponse.json({
      courseId: dna.course_id,
      courseName: dna.course_name,
      city: dna.city,
      state: dna.state,
      dimensions,
      dataSources: dna.data_sources ? JSON.parse(dna.data_sources) : [],
      confidenceScore: dna.confidence_score,
      lastCalculated: dna.last_calculated,
    });
  } catch (error: any) {
    console.error("Course DNA GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course DNA", detail: error.message },
      { status: 500 }
    );
  }
}
