import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Also support ?ids= param (new) alongside ?courses= (existing)
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("courses") || req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "Missing courses parameter" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id));

  if (ids.length < 1 || ids.length > 4) {
    return NextResponse.json(
      { error: "Provide 1 to 4 course IDs" },
      { status: 400 }
    );
  }

  const courses = await prisma.course.findMany({
    where: { courseId: { in: ids } },
    include: {
      rankings: {
        include: { list: { include: { source: true } } },
        orderBy: { rankPosition: "asc" },
      },
      chameleonScores: true,
      media: {
        where: { isPrimary: true },
        take: 1,
      },
      teeBoxes: {
        orderBy: { totalYardage: "desc" },
        take: 1,
      },
      architect: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  // Fetch Course DNA data via raw SQL (table may or may not exist)
  let dnaMap = new Map<number, any>();
  try {
    const dnaRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM course_dna WHERE course_id = ANY($1)`,
      ids
    );
    dnaRows.forEach((row) => {
      dnaMap.set(Number(row.course_id), {
        shotVariety: Number(row.shot_variety || 0),
        strategicOptions: Number(row.strategic_options || 0),
        visualDrama: Number(row.visual_drama || 0),
        greenComplexity: Number(row.green_complexity || 0),
        bunkerChallenge: Number(row.bunker_challenge || 0),
        waterInfluence: Number(row.water_influence || 0),
        elevationChange: Number(row.elevation_change || 0),
        windExposure: Number(row.wind_exposure || 0),
        recoveryDifficulty: Number(row.recovery_difficulty || 0),
        lengthChallenge: Number(row.length_challenge || 0),
        walkabilityScore: Number(row.walkability_score || 0),
        conditioningStandard: Number(row.conditioning_standard || 0),
        confidenceScore: row.confidence_score ? Number(row.confidence_score) : null,
      });
    });
  } catch {
    // course_dna table may not exist yet — ignore
  }

  // Fetch tournament data via raw SQL
  let tournamentMap = new Map<number, any[]>();
  try {
    const tournRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM course_tournaments WHERE course_id = ANY($1) ORDER BY year DESC LIMIT 50`,
      ids
    );
    tournRows.forEach((row) => {
      const cid = Number(row.course_id);
      if (!tournamentMap.has(cid)) tournamentMap.set(cid, []);
      tournamentMap.get(cid)!.push({
        tournamentName: row.tournament_name,
        tour: row.tour,
        year: row.year,
        winnerName: row.winner_name,
        winnerScore: row.winner_score,
      });
    });
  } catch {
    // course_tournaments table may not exist yet — ignore
  }

  // Fetch latest condition reports
  let conditionMap = new Map<number, any>();
  try {
    const condRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT DISTINCT ON (course_id)
        course_id, green_speed, green_firmness, fairway_condition,
        overall_rating, reported_at
      FROM course_conditions
      WHERE course_id = ANY($1)
      ORDER BY course_id, reported_at DESC`,
      ids
    );
    condRows.forEach((row) => {
      conditionMap.set(Number(row.course_id), {
        greenSpeed: row.green_speed,
        greenFirmness: row.green_firmness,
        fairwayCondition: row.fairway_condition,
        overallRating: row.overall_rating,
        reportedAt: row.reported_at,
      });
    });
  } catch {
    // table may not exist
  }

  // Serialize Decimals and Dates for JSON transport
  const serialized = courses.map((course) => {
    const primary = course.media[0];
    const longestTee = course.teeBoxes[0];
    const cs = course.chameleonScores;
    const dna = dnaMap.get(course.courseId) || null;
    const tournaments = tournamentMap.get(course.courseId) || [];
    const latestCondition = conditionMap.get(course.courseId) || null;

    return {
      courseId: course.courseId,
      courseName: course.courseName,
      facilityName: course.facilityName,
      city: course.city,
      state: course.state,
      country: course.country,
      courseStyle: course.courseStyle,
      courseType: course.courseType,
      accessType: course.accessType,
      par: course.par,
      numHoles: course.numHoles,
      yearOpened: course.yearOpened,
      originalArchitect: course.originalArchitect,
      greenFeeLow: course.greenFeeLow ? Number(course.greenFeeLow) : null,
      greenFeeHigh: course.greenFeeHigh ? Number(course.greenFeeHigh) : null,
      greenFeePeak: course.greenFeePeak ? Number(course.greenFeePeak) : null,
      greenFeeOffPeak: course.greenFeeOffPeak ? Number(course.greenFeeOffPeak) : null,
      greenFeeTwilight: course.greenFeeTwilight ? Number(course.greenFeeTwilight) : null,
      greenFeeCurrency: course.greenFeeCurrency,
      walkingPolicy: course.walkingPolicy,
      dressCode: course.dressCode,
      caddieAvailability: course.caddieAvailability,
      primaryImageUrl: primary?.imageUrl ?? null,
      bestTimeToPlay: course.bestTimeToPlay,
      bestConditionMonths: course.bestConditionMonths,
      golfSeason: course.golfSeason,
      bestMonths: course.bestMonths,
      latitude: course.latitude ? Number(course.latitude) : null,
      longitude: course.longitude ? Number(course.longitude) : null,
      yardage: longestTee?.totalYardage ?? null,
      slopeRating: longestTee?.slopeRating ? Number(longestTee.slopeRating) : null,
      courseRating: longestTee?.courseRating ? Number(longestTee.courseRating) : null,
      architect: course.architect,
      rankings: course.rankings.map((r) => ({
        rank: r.rankPosition,
        list: r.list.listName,
        source: r.list.source.sourceName,
        prestigeTier: r.list.prestigeTier,
      })),
      chameleonScore: cs ? Number(cs.chameleonScore) : null,
      prestigeScore: cs ? Number(cs.prestigeScore) : null,
      totalRatings: cs?.totalRatings ?? 0,
      dimensions: cs
        ? {
            conditioning: cs.avgConditioning ? Number(cs.avgConditioning) : null,
            layoutDesign: cs.avgLayoutDesign ? Number(cs.avgLayoutDesign) : null,
            aesthetics: cs.avgAesthetics ? Number(cs.avgAesthetics) : null,
            challenge: cs.avgChallenge ? Number(cs.avgChallenge) : null,
            value: cs.avgValue ? Number(cs.avgValue) : null,
            walkability: cs.avgWalkability ? Number(cs.avgWalkability) : null,
            pace: cs.avgPace ? Number(cs.avgPace) : null,
            amenities: cs.avgAmenities ? Number(cs.avgAmenities) : null,
            service: cs.avgService ? Number(cs.avgService) : null,
          }
        : null,
      // New in 2.0
      dna,
      tournaments,
      tournamentCount: tournaments.length,
      latestCondition,
    };
  });

  // Maintain original order from query params
  const ordered = ids
    .map((id) => serialized.find((c) => c.courseId === id))
    .filter(Boolean);

  return NextResponse.json({ courses: ordered });
}
