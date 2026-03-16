import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  computeDimensionScores,
  computeChameleonScore,
  DEFAULT_DIMENSION_WEIGHTS,
  type DimensionWeights,
} from "@/lib/chameleon-score";

export const dynamic = "force-dynamic";

/**
 * GET /api/scores/course/[id]
 * Returns the Chameleon Score breakdown for a single course.
 * Optional query params for user weights: ?design=8&challenge=10&...
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = parseInt(params.id, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { courseId },
    select: {
      courseId: true,
      courseName: true,
      accessType: true,
      greenFeeLow: true,
      greenFeeHigh: true,
      practiceFacilities: true,
      walkingPolicy: true,
      yearOpened: true,
      renovationYear: true,
      originalArchitect: true,
      chameleonScores: {
        select: { prestigeScore: true },
      },
      teeBoxes: {
        select: { slopeRating: true, courseRating: true },
        orderBy: { slopeRating: "desc" },
        take: 1,
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const prestigeScore = course.chameleonScores?.prestigeScore
    ? Number(course.chameleonScores.prestigeScore)
    : 0;

  // Parse user weights from query params, fall back to defaults
  const sp = req.nextUrl.searchParams;
  const weights: DimensionWeights = { ...DEFAULT_DIMENSION_WEIGHTS };
  for (const key of Object.keys(weights) as (keyof DimensionWeights)[]) {
    const val = sp.get(key);
    if (val) weights[key] = Math.min(Math.max(parseFloat(val) || 5, 0), 10);
  }

  const dimensionScores = computeDimensionScores(
    {
      accessType: course.accessType,
      greenFeeLow: course.greenFeeLow ? Number(course.greenFeeLow) : null,
      greenFeeHigh: course.greenFeeHigh ? Number(course.greenFeeHigh) : null,
      practiceFacilities: course.practiceFacilities,
      walkingPolicy: course.walkingPolicy,
      yearOpened: course.yearOpened,
      renovationYear: course.renovationYear,
      originalArchitect: course.originalArchitect,
      maxSlopeRating: course.teeBoxes[0]?.slopeRating ?? null,
      maxCourseRating: course.teeBoxes[0]?.courseRating
        ? Number(course.teeBoxes[0].courseRating)
        : null,
    },
    prestigeScore
  );

  const { score, breakdown } = computeChameleonScore(
    dimensionScores,
    weights,
    prestigeScore
  );

  return NextResponse.json({
    courseId: course.courseId,
    courseName: course.courseName,
    chameleonScore: score,
    prestigeScore,
    dimensionScores,
    breakdown,
    weights,
  });
}
