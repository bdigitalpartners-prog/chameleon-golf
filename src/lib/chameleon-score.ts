import prisma from "./prisma";

/**
 * Compute prestige scores for all courses using the CF Score algorithm.
 *
 * Algorithm:
 * 1. For each ranking entry: entry_points = (100 / rank_position) * list_weight
 * 2. Per source, take the best (max) entry_points across all lists
 * 3. raw_prestige = SUM(source_authority_weight * source_best_points)
 * 4. Normalize to 0-100 using 99th percentile
 */
export async function computeAllPrestigeScores(): Promise<
  Map<number, { score: number; components: Record<string, number>; numLists: number; bestRanks: Record<string, number> }>
> {
  const entries = await prisma.rankingEntry.findMany({
    where: { rankPosition: { gt: 0 } },
    include: {
      list: { include: { source: true } },
    },
  });

  // Group by course -> source -> best score
  const courseSourceBest = new Map<number, Map<string, { points: number; weight: number; bestRank: number }>>();
  const courseListCount = new Map<number, Set<number>>();

  for (const entry of entries) {
    if (!entry.rankPosition) continue;
    const weightedPoints =
      (100 / entry.rankPosition) * Number(entry.list.listWeight);

    if (!courseSourceBest.has(entry.courseId)) {
      courseSourceBest.set(entry.courseId, new Map());
      courseListCount.set(entry.courseId, new Set());
    }
    courseListCount.get(entry.courseId)!.add(entry.listId);

    const sourceMap = courseSourceBest.get(entry.courseId)!;
    const sourceName = entry.list.source.sourceName;
    const authorityWeight = Number(entry.list.source.authorityWeight);

    const current = sourceMap.get(sourceName);
    if (!current || weightedPoints > current.points) {
      sourceMap.set(sourceName, { points: weightedPoints, weight: authorityWeight, bestRank: entry.rankPosition });
    }
  }

  // Compute raw prestige
  const rawScores = new Map<number, { raw: number; components: Record<string, number>; numLists: number; bestRanks: Record<string, number> }>();
  for (const [courseId, sourceMap] of courseSourceBest) {
    let raw = 0;
    const components: Record<string, number> = {};
    const bestRanks: Record<string, number> = {};
    for (const [sourceName, { points, weight, bestRank }] of sourceMap) {
      const contribution = weight * points;
      raw += contribution;
      components[sourceName] = Math.round(contribution * 100) / 100;
      bestRanks[sourceName] = bestRank;
    }
    rawScores.set(courseId, { raw, components, numLists: courseListCount.get(courseId)!.size, bestRanks });
  }

  // Find 99th percentile for normalization
  const allRaw = Array.from(rawScores.values()).map((v) => v.raw).sort((a, b) => a - b);
  const p99Index = Math.floor(allRaw.length * 0.99);
  const p99 = allRaw[p99Index] || 1;

  // Normalize to 0-100
  const result = new Map<number, { score: number; components: Record<string, number>; numLists: number; bestRanks: Record<string, number> }>();
  for (const [courseId, { raw, components, numLists, bestRanks }] of rawScores) {
    const normalized = Math.min((raw / p99) * 100, 100);
    result.set(courseId, {
      score: Math.round(normalized * 100) / 100,
      components,
      numLists,
      bestRanks,
    });
  }

  return result;
}

/**
 * Map source names to DB field name helpers
 */
function getBestRankFields(bestRanks: Record<string, number>) {
  const mapping: Record<string, string> = {
    "Golf Digest": "bestRankGolfDigest",
    "Golfweek": "bestRankGolfweek",
    "GOLF Magazine": "bestRankGolfMag",
    "GOLF.com": "bestRankGolfMag",
    "Top100GolfCourses": "bestRankTop100gc",
    "Top 100 Golf Courses": "bestRankTop100gc",
  };

  const result: Record<string, number | null> = {
    bestRankGolfDigest: null,
    bestRankGolfweek: null,
    bestRankGolfMag: null,
    bestRankTop100gc: null,
  };

  for (const [sourceName, rank] of Object.entries(bestRanks)) {
    const field = mapping[sourceName];
    if (field) {
      const current = result[field];
      if (current === null || rank < current) {
        result[field] = rank;
      }
    }
  }

  return result;
}

/**
 * Recompute and store CF scores for all courses.
 */
export async function recomputeAndStoreScores() {
  const prestigeMap = await computeAllPrestigeScores();

  const upserts = Array.from(prestigeMap.entries()).map(([courseId, { score, numLists, bestRanks }]) => {
    const rankFields = getBestRankFields(bestRanks);
    return prisma.chameleonScore.upsert({
      where: { courseId },
      update: {
        chameleonScore: score,
        prestigeScore: score,
        numListsAppeared: numLists,
        bestRankGolfDigest: rankFields.bestRankGolfDigest,
        bestRankGolfweek: rankFields.bestRankGolfweek,
        bestRankGolfMag: rankFields.bestRankGolfMag,
        bestRankTop100gc: rankFields.bestRankTop100gc,
        computedAt: new Date(),
      },
      create: {
        courseId,
        chameleonScore: score,
        prestigeScore: score,
        numListsAppeared: numLists,
        bestRankGolfDigest: rankFields.bestRankGolfDigest,
        bestRankGolfweek: rankFields.bestRankGolfweek,
        bestRankGolfMag: rankFields.bestRankGolfMag,
        bestRankTop100gc: rankFields.bestRankTop100gc,
      },
    });
  });

  // Batch in chunks of 50
  for (let i = 0; i < upserts.length; i += 50) {
    await Promise.all(upserts.slice(i, i + 50));
  }

  return prestigeMap.size;
}

/**
 * Recompute a single course's CF score after a user action.
 */
export async function recomputeSingleCourseScore(courseId: number) {
  const entries = await prisma.rankingEntry.findMany({
    where: { courseId, rankPosition: { gt: 0 } },
    include: { list: { include: { source: true } } },
  });

  const sourceMap = new Map<string, { points: number; weight: number; bestRank: number }>();
  let numLists = new Set<number>();

  for (const entry of entries) {
    if (!entry.rankPosition) continue;
    numLists.add(entry.listId);
    const weightedPoints = (100 / entry.rankPosition) * Number(entry.list.listWeight);
    const sourceName = entry.list.source.sourceName;
    const authorityWeight = Number(entry.list.source.authorityWeight);
    const current = sourceMap.get(sourceName);
    if (!current || weightedPoints > current.points) {
      sourceMap.set(sourceName, { points: weightedPoints, weight: authorityWeight, bestRank: entry.rankPosition });
    }
  }

  let raw = 0;
  const bestRanks: Record<string, number> = {};
  for (const [sourceName, { points, weight, bestRank }] of sourceMap) {
    raw += weight * points;
    bestRanks[sourceName] = bestRank;
  }

  const score = Math.min(raw, 100);
  const rankFields = getBestRankFields(bestRanks);

  await prisma.chameleonScore.upsert({
    where: { courseId },
    update: {
      chameleonScore: score,
      prestigeScore: score,
      numListsAppeared: numLists.size,
      ...rankFields,
      computedAt: new Date(),
    },
    create: {
      courseId,
      chameleonScore: score,
      prestigeScore: score,
      numListsAppeared: numLists.size,
      ...rankFields,
    },
  });

  return { score, bestRanks };
}
