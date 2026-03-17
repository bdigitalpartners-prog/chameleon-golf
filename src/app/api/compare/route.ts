import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("courses");
  if (!idsParam) {
    return NextResponse.json({ error: "Missing courses parameter" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id));

  if (ids.length < 2 || ids.length > 4) {
    return NextResponse.json(
      { error: "Provide 2 to 4 course IDs" },
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

  // Serialize Decimals and Dates for JSON transport
  const serialized = courses.map((course) => {
    const primary = course.media[0];
    const longestTee = course.teeBoxes[0];
    const cs = course.chameleonScores;

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
    };
  });

  // Maintain original order from query params
  const ordered = ids
    .map((id) => serialized.find((c) => c.courseId === id))
    .filter(Boolean);

  return NextResponse.json({ courses: ordered });
}
