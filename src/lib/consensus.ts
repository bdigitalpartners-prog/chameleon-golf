import prisma from "./prisma";

/**
 * Calculate consensus for a specific circle + course combination.
 *
 * - agreementLevel: 1 - (stddev / maxPossibleStddev) → 0=total disagreement, 1=perfect agreement
 * - comparedToNational: circleAvg - nationalAvg (from existing ChameleonScore data)
 * - outlierUserIds: members whose rating differs > 2 points from circle mean
 */
export async function calculateConsensus(
  circleId: string,
  courseId: number
): Promise<void> {
  const ratings = await prisma.circleCourseRating.findMany({
    where: { circleId, courseId },
  });

  if (ratings.length < 2) {
    // Need at least 2 ratings for meaningful consensus
    await prisma.circleConsensus.deleteMany({
      where: { circleId, courseId },
    });
    return;
  }

  const scores = ratings.map((r) => r.overallScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Standard deviation
  const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const stddev = Math.sqrt(variance);

  // Max possible stddev for a 0-10 scale is 5 (half the range)
  const maxStddev = 5;
  const agreementLevel = Math.max(0, Math.min(1, 1 - stddev / maxStddev));

  // Compare to national average (ChameleonScore normalized to 0-10)
  let comparedToNational: number | null = null;
  const chameleonScore = await prisma.chameleonScore.findUnique({
    where: { courseId },
  });
  if (chameleonScore) {
    const nationalAvg = Number(chameleonScore.chameleonScore) / 10;
    comparedToNational = Math.round((mean - nationalAvg) * 10) / 10;
  }

  // Outliers: members who differ > 2 points from mean
  const outlierUserIds = ratings
    .filter((r) => Math.abs(r.overallScore - mean) > 2)
    .map((r) => r.userId);

  await prisma.circleConsensus.upsert({
    where: { circleId_courseId: { circleId, courseId } },
    create: {
      circleId,
      courseId,
      consensusScore: Math.round(mean * 10) / 10,
      agreementLevel: Math.round(agreementLevel * 100) / 100,
      comparedToNational,
      outlierUserIds,
      lastUpdated: new Date(),
    },
    update: {
      consensusScore: Math.round(mean * 10) / 10,
      agreementLevel: Math.round(agreementLevel * 100) / 100,
      comparedToNational,
      outlierUserIds,
      lastUpdated: new Date(),
    },
  });
}

/**
 * Batch recalculate consensus for all courses rated by a circle.
 */
export async function recalculateAllConsensus(circleId: string): Promise<void> {
  // Get all distinct courses rated by this circle
  const courseIds = await prisma.circleCourseRating.findMany({
    where: { circleId },
    distinct: ["courseId"],
    select: { courseId: true },
  });

  for (const { courseId } of courseIds) {
    await calculateConsensus(circleId, courseId);
  }
}
