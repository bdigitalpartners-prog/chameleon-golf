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
 * POST /api/scores/rank
 * Accepts user weights, returns re-ranked course list (paginated).
 * Body: { weights: DimensionWeights, page?: number, limit?: number }
 */
export async function POST(req: NextRequest) {
  let body: { weights?: Partial<DimensionWeights>; page?: number; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const page = Math.max(body.page ?? 1, 1);
  const limit = Math.min(Math.max(body.limit ?? 25, 1), 100);

  const weights: DimensionWeights = { ...DEFAULT_DIMENSION_WEIGHTS };
  if (body.weights) {
    for (const key of Object.keys(weights) as (keyof DimensionWeights)[]) {
      if (body.weights[key] !== undefined) {
        weights[key] = Math.min(Math.max(Number(body.weights[key]) || 5, 0), 10);
      }
    }
  }

  // Fetch all courses with prestige scores
  const courses = await prisma.course.findMany({
    where: {
      chameleonScores: { isNot: null },
    },
    select: {
      courseId: true,
      courseName: true,
      facilityName: true,
      city: true,
      state: true,
      country: true,
      accessType: true,
      courseStyle: true,
      originalArchitect: true,
      yearOpened: true,
      renovationYear: true,
      greenFeeLow: true,
      greenFeeHigh: true,
      walkingPolicy: true,
      practiceFacilities: true,
      numListsAppeared: true,
      media: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
      chameleonScores: {
        select: {
          prestigeScore: true,
          numListsAppeared: true,
          bestRankGolfDigest: true,
          bestRankGolfweek: true,
          bestRankGolfMag: true,
          bestRankTop100gc: true,
        },
      },
      teeBoxes: {
        select: { slopeRating: true, courseRating: true },
        orderBy: { slopeRating: "desc" },
        take: 1,
      },
    },
  });

  // Score and rank all courses
  const scored = courses.map((c) => {
    const prestige = c.chameleonScores?.prestigeScore
      ? Number(c.chameleonScores.prestigeScore)
      : 0;

    const dimScores = computeDimensionScores(
      {
        accessType: c.accessType,
        greenFeeLow: c.greenFeeLow ? Number(c.greenFeeLow) : null,
        greenFeeHigh: c.greenFeeHigh ? Number(c.greenFeeHigh) : null,
        practiceFacilities: c.practiceFacilities,
        walkingPolicy: c.walkingPolicy,
        yearOpened: c.yearOpened,
        renovationYear: c.renovationYear,
        originalArchitect: c.originalArchitect,
        maxSlopeRating: c.teeBoxes[0]?.slopeRating ?? null,
        maxCourseRating: c.teeBoxes[0]?.courseRating
          ? Number(c.teeBoxes[0].courseRating)
          : null,
      },
      prestige
    );

    const { score, breakdown } = computeChameleonScore(dimScores, weights, prestige);

    const cs = c.chameleonScores;
    const ranks = [
      cs?.bestRankGolfDigest ? { rank: cs.bestRankGolfDigest, source: "Golf Digest" } : null,
      cs?.bestRankGolfweek ? { rank: cs.bestRankGolfweek, source: "Golfweek" } : null,
      cs?.bestRankGolfMag ? { rank: cs.bestRankGolfMag, source: "GOLF Magazine" } : null,
      cs?.bestRankTop100gc ? { rank: cs.bestRankTop100gc, source: "Top100GolfCourses" } : null,
    ].filter(Boolean) as { rank: number; source: string }[];
    const best = ranks.sort((a, b) => a.rank - b.rank)[0] ?? null;

    return {
      courseId: c.courseId,
      courseName: c.courseName,
      facilityName: c.facilityName,
      city: c.city,
      state: c.state,
      country: c.country,
      accessType: c.accessType,
      courseStyle: c.courseStyle,
      originalArchitect: c.originalArchitect,
      greenFeeLow: c.greenFeeLow ? Number(c.greenFeeLow) : null,
      greenFeeHigh: c.greenFeeHigh ? Number(c.greenFeeHigh) : null,
      numListsAppeared: cs?.numListsAppeared ?? c.numListsAppeared ?? 0,
      primaryImageUrl: c.media[0]?.url ?? null,
      prestigeScore: prestige,
      chameleonScore: score,
      dimensionScores: dimScores,
      breakdown,
      bestRank: best?.rank ?? null,
      bestSource: best?.source ?? null,
    };
  });

  // Sort by chameleon score descending
  scored.sort((a, b) => b.chameleonScore - a.chameleonScore);

  const totalCourses = scored.length;
  const totalPages = Math.ceil(totalCourses / limit);
  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  return NextResponse.json({
    courses: paginated,
    pagination: {
      page,
      limit,
      totalCourses,
      totalPages,
    },
    weights,
  });
}
