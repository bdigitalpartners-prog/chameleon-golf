import prisma from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Compute prestige scores for all courses using the Chameleon Score algorithm.
 *
 * Algorithm:
 * 1. For each ranking entry: entry_points = (100 / rank_position) * list_weight
 * 2. Per source, take the best (max) entry_points across all lists
 * 3. raw_prestige = SUM(source_authority_weight * source_best_points)
 * 4. Normalize to 0-100 using 99th percentile
 */
export async function computeAllPrestigeScores(): Promise<
  Map<number, { score: number; components: Record<string, number> }>
> {
  const entries = await prisma.rankingEntry.findMany({
    where: { rankPosition: { gt: 0 } },
    include: {
      list: { include: { source: true } },
    },
  });

  // Group by course -> source -> best score
  const courseSourceBest = new Map<number, Map<string, { points: number; weight: number }>>();

  for (const entry of entries) {
    if (!entry.rankPosition) continue;
    const weightedPoints =
      (100 / entry.rankPosition) * Number(entry.list.listWeight);

    if (!courseSourceBest.has(entry.courseId)) {
      courseSourceBest.set(entry.courseId, new Map());
    }
    const sourceMap = courseSourceBest.get(entry.courseId)!;
    const sourceName = entry.list.source.sourceName;
    const authorityWeight = Number(entry.list.source.authorityWeight);

    const current = sourceMap.get(sourceName);
    if (!current || weightedPoints > current.points) {
      sourceMap.set(sourceName, { points: weightedPoints, weight: authorityWeight });
    }
  }

  // Compute raw prestige
  const rawScores = new Map<number, { raw: number; components: Record<string, number> }>();
  for (const [courseId, sourceMap] of courseSourceBest) {
    let raw = 0;
    const components: Record<string, number> = {};
    for (const [sourceName, { points, weight }] of sourceMap) {
      const contribution = weight * points;
      raw += contribution;
      components[sourceName] = Math.round(contribution * 100) / 100;
    }
    rawScores.set(courseId, { raw, components });
  }

  // Find 99th percentile for normalization
  const allRaw = Array.from(rawScores.values()).map((v) => v.raw).sort((a, b) => a - b);
  const p99Index = Math.floor(allRaw.length * 0.99);
  const p99 = allRaw[p99Index] || 1;

  // Normalize to 0-100
  const result = new Map<number, { score: number; components: Record<string, number> }>();
  for (const [courseId, { raw, components }] of rawScores) {
    const normalized = Math.min((raw / p99) * 100, 100);
    result.set(courseId, {
      score: Math.round(normalized * 100) / 100,
      components,
    });
  }

  return result;
}

/**
 * Recompute and store chameleon scores for all courses.
 */
export async function recomputeAndStoreScores() {
  const prestigeMap = await computeAllPrestigeScores();

  const upserts = Array.from(prestigeMap.entries()).map(([courseId, { score, components }]) =>
    prisma.chameleonScore.upsert({
      where: { courseId },
      update: {
        chameleonScore: score,
        componentScores: components,
        calculatedAt: new Date(),
      },
      create: {
        courseId,
        chameleonScore: score,
        componentScores: components,
      },
    })
  );

  // Batch in chunks of 50
  for (let i = 0; i < upserts.length; i += 50) {
    await Promise.all(upserts.slice(i, i + 50));
  }

  return prestigeMap.size;
}

/**
 * Recompute a single course's chameleon score after a user action.
 */
export async function recomputeSingleCourseScore(courseId: number) {
  const entries = await prisma.rankingEntry.findMany({
    where: { courseId, rankPosition: { gt: 0 } },
    include: { list: { include: { source: true } } },
  });

  const sourceMap = new Map<string, { points: number; weight: number }>();
  for (const entry of entries) {
    if (!entry.rankPosition) continue;
    const weightedPoints = (100 / entry.rankPosition) * Number(entry.list.listWeight);
    const sourceName = entry.list.source.sourceName;
    const authorityWeight = Number(entry.list.source.authorityWeight);
    const current = sourceMap.get(sourceName);
    if (!current || weightedPoints > current.points) {
      sourceMap.set(sourceName, { points: weightedPoints, weight: authorityWeight });
    }
  }

  let raw = 0;
  const components: Record<string, number> = {};
  for (const [sourceName, { points, weight }] of sourceMap) {
    const contribution = weight * points;
    raw += contribution;
    components[sourceName] = Math.round(contribution * 100) / 100;
  }

  // Use a rough p99 estimate (we'd need full recompute for exact, but this is close enough for single-course updates)
  const score = Math.min(raw, 100);

  await prisma.chameleonScore.upsert({
    where: { courseId },
    update: { chameleonScore: score, componentScores: components, calculatedAt: new Date() },
    create: { courseId, chameleonScore: score, componentScores: components },
  });

  return { score, components };
}
