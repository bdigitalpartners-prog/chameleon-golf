import prisma from '@/lib/prisma';

export function calculateTrueDifficultyIndex(slopeRating: number, courseRating: number, par: number): number {
  // WHS-based difficulty calculation
  // Higher slope + higher course rating = harder course
  const slopeFactor = (slopeRating - 113) / 113; // 113 is standard
  const ratingDiff = courseRating - par;
  const tdi = 50 + (slopeFactor * 30) + (ratingDiff * 5);
  return Math.min(100, Math.max(0, Math.round(tdi * 100) / 100));
}

export function estimateBreakScore(targetScore: number, handicapIndex: number, courseRating: number, slopeRating: number): boolean {
  // Calculate expected score: handicapIndex * (slope/113) + courseRating
  const courseHandicap = Math.round(handicapIndex * (slopeRating / 113));
  const expectedScore = courseRating + courseHandicap;
  return expectedScore <= targetScore;
}

export function getIdealHandicapRange(courseRating: number, slopeRating: number): { low: number; high: number } {
  // Courses play best for a range of handicaps
  const baseDifficulty = (slopeRating - 113) / 10;
  const low = Math.max(0, Math.round(baseDifficulty * 2));
  const high = Math.min(36, Math.round(baseDifficulty * 2 + 15));
  return { low, high };
}

export async function computeCourseDifficulties(): Promise<number> {
  const courses = await prisma.course.findMany({
    include: { teeBoxes: true },
    where: { teeBoxes: { some: {} } },
  });

  let count = 0;
  for (const course of courses) {
    const backTees = course.teeBoxes.reduce((hardest, tb) =>
      (tb.slopeRating ?? 0) > (hardest.slopeRating ?? 0) ? tb : hardest
    , course.teeBoxes[0]);

    if (!backTees?.slopeRating || !backTees?.courseRating) continue;

    const slope = backTees.slopeRating;
    const rating = Number(backTees.courseRating);
    const par = course.par ?? 72;
    const tdi = calculateTrueDifficultyIndex(slope, rating, par);
    const range = getIdealHandicapRange(rating, slope);

    await prisma.courseDifficulty.upsert({
      where: { courseId: course.courseId },
      create: {
        courseId: course.courseId,
        trueDifficultyIndex: tdi,
        slopeRating: slope,
        courseRating: rating,
        idealHandicapLow: range.low,
        idealHandicapHigh: range.high,
        break80Handicap: Math.max(0, 80 - rating) * (113 / slope),
        break90Handicap: Math.max(0, 90 - rating) * (113 / slope),
        break100Handicap: Math.max(0, 100 - rating) * (113 / slope),
      },
      update: {
        trueDifficultyIndex: tdi,
        slopeRating: slope,
        courseRating: rating,
        idealHandicapLow: range.low,
        idealHandicapHigh: range.high,
        break80Handicap: Math.max(0, 80 - rating) * (113 / slope),
        break90Handicap: Math.max(0, 90 - rating) * (113 / slope),
        break100Handicap: Math.max(0, 100 - rating) * (113 / slope),
        computedAt: new Date(),
      },
    });
    count++;
  }
  return count;
}
