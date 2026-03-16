import prisma from "./prisma";

/**
 * Calculate the circle-weighted component of a user's Chameleon Score for a course.
 * Considers the user's circle memberships, their weight settings, and each circle's aggregate rating.
 */
export async function getCircleScoreComponent(
  userId: string,
  courseId: number
): Promise<{
  score: number | null;
  circleBreakdown: Array<{
    circleId: string;
    circleName: string;
    avgScore: number;
    weight: number;
    ratingCount: number;
  }>;
}> {
  // Get the user's circle weight settings for enabled circles
  const weights = await prisma.circleScoreWeight.findMany({
    where: { userId, enabled: true },
    include: {
      circle: {
        select: { id: true, name: true },
      },
    },
  });

  if (weights.length === 0) {
    // If no weights set, check if user has circle memberships and create defaults
    const memberships = await prisma.circleMembership.findMany({
      where: { userId, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
      include: { circle: { select: { id: true, name: true } } },
    });

    if (memberships.length === 0) {
      return { score: null, circleBreakdown: [] };
    }

    // Auto-create default weights
    for (const m of memberships) {
      await prisma.circleScoreWeight.upsert({
        where: { userId_circleId: { userId, circleId: m.circleId } },
        create: { userId, circleId: m.circleId, weight: 0.5, enabled: true },
        update: {},
      });
    }

    // Re-fetch
    return getCircleScoreComponent(userId, courseId);
  }

  const circleIds = weights.map((w) => w.circleId);

  // Get aggregates for this course from user's circles
  const aggregates = await prisma.circleCourseAggregate.findMany({
    where: {
      circleId: { in: circleIds },
      courseId,
    },
  });

  if (aggregates.length === 0) {
    return { score: null, circleBreakdown: [] };
  }

  const aggMap = new Map(aggregates.map((a) => [a.circleId, a]));

  // Calculate weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  const circleBreakdown: Array<{
    circleId: string;
    circleName: string;
    avgScore: number;
    weight: number;
    ratingCount: number;
  }> = [];

  for (const w of weights) {
    const agg = aggMap.get(w.circleId);
    if (!agg) continue;

    totalWeight += w.weight;
    weightedSum += w.weight * agg.avgScore;

    circleBreakdown.push({
      circleId: w.circleId,
      circleName: w.circle.name,
      avgScore: Math.round(agg.avgScore * 10) / 10,
      weight: w.weight,
      ratingCount: agg.ratingCount,
    });
  }

  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;

  return { score, circleBreakdown };
}

/**
 * Compute the full personalized Chameleon Score for a user viewing a course.
 *
 * Formula:
 *   chameleonScore = (editorialWeight * editorialScore) + (personalWeight * personalScore) + (circleWeight * circleScore)
 *   Default weights: editorial=0.3, personal=0.3, circle=0.4
 */
export async function computePersonalizedScore(
  userId: string,
  courseId: number
): Promise<{
  personalizedScore: number | null;
  editorialScore: number | null;
  personalScore: number | null;
  circleScore: number | null;
  circleBreakdown: Array<{
    circleId: string;
    circleName: string;
    avgScore: number;
    weight: number;
    ratingCount: number;
  }>;
  weights: { editorial: number; personal: number; circle: number };
}> {
  // 1. Editorial score (from ChameleonScore table, normalized 0-10)
  const chameleonScoreRow = await prisma.chameleonScore.findUnique({
    where: { courseId },
  });
  const editorialScore = chameleonScoreRow
    ? Math.round(Number(chameleonScoreRow.chameleonScore) / 10 * 10) / 10
    : null;

  // 2. Personal score (user's own rating)
  const userRating = await prisma.userCourseRating.findFirst({
    where: { userId, courseId },
    orderBy: { createdAt: "desc" },
  });
  const personalScore = userRating ? Number(userRating.overallRating) : null;

  // 3. Circle score
  const circleData = await getCircleScoreComponent(userId, courseId);

  // Determine weights
  const hasEditorial = editorialScore !== null;
  const hasPersonal = personalScore !== null;
  const hasCircle = circleData.score !== null;

  let weights = { editorial: 0.3, personal: 0.3, circle: 0.4 };

  // Adjust weights based on available data
  if (!hasCircle && hasEditorial && hasPersonal) {
    weights = { editorial: 0.5, personal: 0.5, circle: 0 };
  } else if (!hasCircle && hasEditorial && !hasPersonal) {
    weights = { editorial: 1.0, personal: 0, circle: 0 };
  } else if (!hasCircle && !hasEditorial && hasPersonal) {
    weights = { editorial: 0, personal: 1.0, circle: 0 };
  } else if (hasCircle && !hasEditorial && !hasPersonal) {
    weights = { editorial: 0, personal: 0, circle: 1.0 };
  } else if (hasCircle && hasEditorial && !hasPersonal) {
    weights = { editorial: 0.4, personal: 0, circle: 0.6 };
  } else if (hasCircle && !hasEditorial && hasPersonal) {
    weights = { editorial: 0, personal: 0.4, circle: 0.6 };
  }

  let personalizedScore: number | null = null;
  const components: number[] = [];

  if (hasEditorial) components.push(weights.editorial * editorialScore!);
  if (hasPersonal) components.push(weights.personal * personalScore!);
  if (hasCircle) components.push(weights.circle * circleData.score!);

  if (components.length > 0) {
    personalizedScore = Math.round(components.reduce((a, b) => a + b, 0) * 10) / 10;
  }

  return {
    personalizedScore,
    editorialScore,
    personalScore,
    circleScore: circleData.score,
    circleBreakdown: circleData.circleBreakdown,
    weights,
  };
}
