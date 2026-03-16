import prisma from "./prisma";

export async function recalculateAggregate(circleId: string, courseId: number): Promise<void> {
  // Get all ratings for this circle+course
  const ratings = await prisma.circleCourseRating.findMany({
    where: { circleId, courseId },
  });

  if (ratings.length === 0) {
    // Remove aggregate if no ratings left
    await prisma.circleCourseAggregate.deleteMany({
      where: { circleId, courseId },
    });
    // Recalculate ranks for this circle
    await recalculateRanks(circleId);
    return;
  }

  // Calculate average overall score
  const avgScore = ratings.reduce((sum, r) => sum + r.overallScore, 0) / ratings.length;

  // Calculate dimension averages
  const dimensionKeys = ["conditioning", "design", "difficulty", "amenities", "value"];
  const dimensionAvgs: Record<string, number> = {};

  for (const key of dimensionKeys) {
    const vals = ratings
      .map((r) => {
        const dims = r.dimensions as Record<string, number> | null;
        return dims?.[key] ?? null;
      })
      .filter((v): v is number => v !== null);

    if (vals.length > 0) {
      dimensionAvgs[key] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }
  }

  // Upsert aggregate
  await prisma.circleCourseAggregate.upsert({
    where: { circleId_courseId: { circleId, courseId } },
    create: {
      circleId,
      courseId,
      avgScore: Math.round(avgScore * 10) / 10,
      ratingCount: ratings.length,
      dimensionAvgs: Object.keys(dimensionAvgs).length > 0 ? dimensionAvgs : undefined,
      lastUpdated: new Date(),
    },
    update: {
      avgScore: Math.round(avgScore * 10) / 10,
      ratingCount: ratings.length,
      dimensionAvgs: Object.keys(dimensionAvgs).length > 0 ? dimensionAvgs : undefined,
      lastUpdated: new Date(),
    },
  });

  // Recalculate ranks within the circle
  await recalculateRanks(circleId);
}

async function recalculateRanks(circleId: string): Promise<void> {
  const aggregates = await prisma.circleCourseAggregate.findMany({
    where: { circleId },
    orderBy: { avgScore: "desc" },
  });

  for (let i = 0; i < aggregates.length; i++) {
    await prisma.circleCourseAggregate.update({
      where: { id: aggregates[i].id },
      data: { rank: i + 1 },
    });
  }
}
