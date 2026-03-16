import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/scores/prestige
 * Returns pre-computed prestige scores for all courses with basic course info.
 */
export async function GET() {
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
          chameleonScore: true,
          numListsAppeared: true,
          bestRankGolfDigest: true,
          bestRankGolfweek: true,
          bestRankGolfMag: true,
          bestRankTop100gc: true,
          avgConditioning: true,
          avgLayoutDesign: true,
          avgPace: true,
          avgAesthetics: true,
          avgChallenge: true,
          avgValue: true,
          avgAmenities: true,
          avgWalkability: true,
          avgService: true,
          avgOverall: true,
        },
      },
      teeBoxes: {
        select: {
          slopeRating: true,
          courseRating: true,
        },
        orderBy: { slopeRating: "desc" },
        take: 1,
      },
    },
    orderBy: {
      chameleonScores: { chameleonScore: "desc" },
    },
  });

  const result = courses.map((c) => {
    const cs = c.chameleonScores;
    // Find best rank across sources
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
      yearOpened: c.yearOpened,
      renovationYear: c.renovationYear,
      greenFeeLow: c.greenFeeLow ? Number(c.greenFeeLow) : null,
      greenFeeHigh: c.greenFeeHigh ? Number(c.greenFeeHigh) : null,
      walkingPolicy: c.walkingPolicy,
      practiceFacilities: c.practiceFacilities,
      numListsAppeared: cs?.numListsAppeared ?? c.numListsAppeared ?? 0,
      primaryImageUrl: c.media[0]?.url ?? null,
      prestigeScore: cs?.prestigeScore ? Number(cs.prestigeScore) : 0,
      chameleonScore: cs?.chameleonScore ? Number(cs.chameleonScore) : 0,
      maxSlopeRating: c.teeBoxes[0]?.slopeRating ?? null,
      maxCourseRating: c.teeBoxes[0]?.courseRating ? Number(c.teeBoxes[0].courseRating) : null,
      bestRank: best?.rank ?? null,
      bestSource: best?.source ?? null,
      // Pre-computed dimension scores (0-10 scale)
      dimensionScores: cs?.avgOverall != null ? {
        avgConditioning: cs.avgConditioning ? Number(cs.avgConditioning) : null,
        avgLayoutDesign: cs.avgLayoutDesign ? Number(cs.avgLayoutDesign) : null,
        avgPace: cs.avgPace ? Number(cs.avgPace) : null,
        avgAesthetics: cs.avgAesthetics ? Number(cs.avgAesthetics) : null,
        avgChallenge: cs.avgChallenge ? Number(cs.avgChallenge) : null,
        avgValue: cs.avgValue ? Number(cs.avgValue) : null,
        avgAmenities: cs.avgAmenities ? Number(cs.avgAmenities) : null,
        avgWalkability: cs.avgWalkability ? Number(cs.avgWalkability) : null,
        avgService: cs.avgService ? Number(cs.avgService) : null,
        avgOverall: cs.avgOverall ? Number(cs.avgOverall) : null,
      } : null,
    };
  });

  return NextResponse.json(result);
}
