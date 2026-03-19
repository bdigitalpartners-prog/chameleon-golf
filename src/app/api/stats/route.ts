import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const [courses, rankingLists, rankingEntries, architects, rankingSources, airports] =
    await Promise.all([
      prisma.course.count(),
      prisma.rankingList.count(),
      prisma.rankingEntry.count(),
      prisma.architect.count(),
      prisma.rankingSource.count(),
      prisma.airport.count(),
    ]);

  return NextResponse.json({
    courses,
    rankingLists,
    rankingEntries,
    architects,
    rankingSources,
    airports,
  });
}
