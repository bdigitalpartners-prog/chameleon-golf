import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DNA_DIMENSIONS = [
  "shot_variety", "strategic_options", "visual_drama", "green_complexity",
  "bunker_challenge", "water_influence", "elevation_change", "wind_exposure",
  "recovery_difficulty", "length_challenge", "walkability_score", "conditioning_standard",
] as const;

// GET — Find courses with similar DNA profiles using Euclidean distance
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 50);

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Get the target course's DNA
    const target = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM course_dna WHERE course_id = $1`,
      Number(courseId)
    );

    if (target.length === 0) {
      return NextResponse.json(
        { error: "No DNA profile found for this course" },
        { status: 404 }
      );
    }

    const t = target[0];

    // Calculate Euclidean distance for all other courses
    const distanceParts = DNA_DIMENSIONS.map(
      (dim) => `POWER(cd.${dim} - ${t[dim] ?? 0}, 2)`
    ).join(" + ");

    const similar = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cd.course_id, cd.*,
              c."courseName" as course_name,
              c."city", c."state",
              SQRT(${distanceParts}) as distance
       FROM course_dna cd
       LEFT JOIN courses c ON c."courseId" = cd.course_id
       WHERE cd.course_id != $1
       ORDER BY distance ASC
       LIMIT $2`,
      Number(courseId),
      limit
    );

    const results = similar.map((row) => ({
      courseId: row.course_id,
      courseName: row.course_name,
      city: row.city,
      state: row.state,
      similarity: Math.max(0, Math.round((1 - row.distance / 346.41) * 100)), // 346.41 = sqrt(12 * 100^2) max possible distance
      distance: Math.round(row.distance * 100) / 100,
    }));

    return NextResponse.json({ courseId: Number(courseId), similar: results });
  } catch (error: any) {
    console.error("Similar courses error:", error);
    return NextResponse.json(
      { error: "Failed to find similar courses", detail: error.message },
      { status: 500 }
    );
  }
}
