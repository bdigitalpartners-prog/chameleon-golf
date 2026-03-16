import prisma from "./prisma";

/**
 * golfEQUALIZER Score Engine
 * ==========================
 * Computes the Equalizer Score (0-100) for every course based on:
 *   60% Expert Prestige Score (from 46 ranking lists across 4 sources)
 *   40% Community Ratings (when available)
 *
 * Prestige Algorithm:
 * 1. Each of 46 lists is classified into a prestige tier (Flagship 1.0, Major 0.7, Regional 0.4, Specialty 0.2)
 * 2. rank_score = 100 * (1 - (rank - 1) / list_size) — linear decay from #1 (100) to #last (≈0)
 * 3. Per source: take BEST (rank_score * tier_weight) across all that source's lists
 * 4. prestige = weighted avg across sources (by source authority) + breadth bonus (0-10 for 1-4 sources)
 */

// Prestige tier classification for all 46 lists
const TIER_MAP: Record<number, string> = {
  // Golf Digest (source 1)
  6: "flagship",  // America's 100 Greatest
  3: "major",     // America's Second 100 Greatest
  5: "major",     // America's 100 Greatest Public

  // Golfweek (source 2)
  4: "flagship",  // Best Classic
  2: "flagship",  // Best Modern
  1: "major",     // Best Resort
  7: "major",     // Best Public Access

  // GOLF Magazine (source 3)
  46: "flagship", // Top 100 in the World
  45: "flagship", // Top 100 You Can Play

  // Top100GolfCourses.com (source 4)
  42: "flagship", // World Top 100
  12: "major", 15: "major", 11: "major", 9: "major", 10: "major", // Major regionals
  35: "major", 26: "major", // Value/Pay & Play
  8: "regional", 14: "regional", 16: "regional", 17: "regional", 13: "regional",
  18: "regional", 21: "regional", 43: "regional",
  44: "specialty", 20: "specialty", 22: "specialty", 19: "specialty",
  23: "specialty", 24: "specialty", 25: "specialty", 27: "specialty",
  31: "specialty", 32: "specialty", 41: "specialty",
  28: "specialty", 29: "specialty", 30: "specialty", 33: "specialty",
  34: "specialty", 36: "specialty", 37: "specialty", 38: "specialty",
  39: "specialty", 40: "specialty",
};

const TIER_WEIGHTS: Record<string, number> = {
  flagship: 1.0,
  major: 0.7,
  regional: 0.4,
  specialty: 0.2,
};

function rankToScore(rank: number, listSize: number): number {
  if (!rank || rank <= 0) return 0;
  return Math.max(0, 100 * (1 - (rank - 1) / listSize));
}

/**
 * Map source names to DB field name helpers
 */
function getBestRankFields(bestRanks: Record<string, number>) {
  const mapping: Record<string, string> = {
    "Golf Digest": "bestRankGolfDigest",
    "Golfweek": "bestRankGolfweek",
    "GOLF Magazine / GOLF.com": "bestRankGolfMag",
    "Top100GolfCourses.com": "bestRankTop100gc",
  };

  const result: Record<string, number | null> = {
    bestRankGolfDigest: null,
    bestRankGolfweek: null,
    bestRankGolfMag: null,
    bestRankTop100gc: null,
  };

  for (const [sourceName, rank] of Object.entries(bestRanks)) {
    for (const [pattern, field] of Object.entries(mapping)) {
      if (sourceName.includes(pattern) || pattern.includes(sourceName)) {
        const current = result[field];
        if (current === null || rank < current) {
          result[field] = rank;
        }
      }
    }
  }

  return result;
}

/**
 * Compute prestige scores for all courses.
 */
export async function computeAllPrestigeScores(): Promise<
  Map<number, { score: number; numLists: number; bestRanks: Record<string, number> }>
> {
  const entries = await prisma.rankingEntry.findMany({
    where: { rankPosition: { gt: 0 } },
    include: {
      list: { include: { source: true } },
    },
  });

  // Count list sizes
  const listSizes = new Map<number, number>();
  for (const entry of entries) {
    listSizes.set(entry.listId, (listSizes.get(entry.listId) || 0) + 1);
  }

  // Group by course
  const courseEntries = new Map<number, Array<{ listId: number; rank: number; sourceId: number; sourceName: string; authorityWeight: number }>>();
  const courseListCount = new Map<number, Set<number>>();

  for (const entry of entries) {
    if (!entry.rankPosition) continue;
    const cid = entry.courseId;
    if (!courseEntries.has(cid)) {
      courseEntries.set(cid, []);
      courseListCount.set(cid, new Set());
    }
    courseListCount.get(cid)!.add(entry.listId);
    courseEntries.get(cid)!.push({
      listId: entry.listId,
      rank: entry.rankPosition,
      sourceId: entry.list.sourceId,
      sourceName: entry.list.source.sourceName,
      authorityWeight: Number(entry.list.source.authorityWeight),
    });
  }

  const result = new Map<number, { score: number; numLists: number; bestRanks: Record<string, number> }>();

  for (const [courseId, entryList] of courseEntries) {
    // Per-source best weighted score
    const sourceBest = new Map<string, { weightedScore: number; bestRank: number; authorityWeight: number }>();

    for (const { listId, rank, sourceName, authorityWeight } of entryList) {
      const tier = TIER_MAP[listId] || "regional";
      const tierWeight = TIER_WEIGHTS[tier] || 0.4;
      const listSize = listSizes.get(listId) || 100;
      const weighted = rankToScore(rank, listSize) * tierWeight;

      const current = sourceBest.get(sourceName);
      if (!current || weighted > current.weightedScore) {
        sourceBest.set(sourceName, { weightedScore: weighted, bestRank: rank, authorityWeight });
      }
    }

    // Weighted average across sources
    let totalWeight = 0;
    let totalScore = 0;
    const bestRanks: Record<string, number> = {};

    for (const [sourceName, { weightedScore, bestRank, authorityWeight }] of sourceBest) {
      totalWeight += authorityWeight;
      totalScore += weightedScore * authorityWeight;
      bestRanks[sourceName] = bestRank;
    }

    let prestige = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Breadth bonus: appearing on more sources is a quality signal
    const numSources = sourceBest.size;
    const breadthBonus = Math.min(10, (numSources - 1) * 3.33);
    prestige = Math.min(100, prestige + breadthBonus);

    result.set(courseId, {
      score: Math.round(prestige * 100) / 100,
      numLists: courseListCount.get(courseId)!.size,
      bestRanks,
    });
  }

  return result;
}

/**
 * Recompute and store Equalizer scores for all courses.
 */
export async function recomputeAndStoreScores() {
  const prestigeMap = await computeAllPrestigeScores();

  // Also update prestige tiers in ranking_lists
  for (const [listId, tier] of Object.entries(TIER_MAP)) {
    const weight = TIER_WEIGHTS[tier] || 0.4;
    await prisma.rankingList.update({
      where: { listId: Number(listId) },
      data: { prestigeTier: tier, listWeight: weight },
    }).catch(() => {});
  }

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
 * Recompute a single course's Equalizer score (e.g. after a new rating).
 */
export async function recomputeSingleCourseScore(courseId: number) {
  const entries = await prisma.rankingEntry.findMany({
    where: { courseId, rankPosition: { gt: 0 } },
    include: { list: { include: { source: true } } },
  });

  // Count list sizes for this course's lists
  const listIds = [...new Set(entries.map((e) => e.listId))];
  const listSizes = new Map<number, number>();
  for (const lid of listIds) {
    const count = await prisma.rankingEntry.count({ where: { listId: lid } });
    listSizes.set(lid, count);
  }

  const sourceBest = new Map<string, { weightedScore: number; bestRank: number; authorityWeight: number }>();
  const numLists = new Set<number>();

  for (const entry of entries) {
    if (!entry.rankPosition) continue;
    numLists.add(entry.listId);
    const tier = TIER_MAP[entry.listId] || "regional";
    const tierWeight = TIER_WEIGHTS[tier] || 0.4;
    const listSize = listSizes.get(entry.listId) || 100;
    const weighted = rankToScore(entry.rankPosition, listSize) * tierWeight;
    const sourceName = entry.list.source.sourceName;
    const authorityWeight = Number(entry.list.source.authorityWeight);

    const current = sourceBest.get(sourceName);
    if (!current || weighted > current.weightedScore) {
      sourceBest.set(sourceName, { weightedScore: weighted, bestRank: entry.rankPosition, authorityWeight });
    }
  }

  let totalWeight = 0;
  let totalScore = 0;
  const bestRanks: Record<string, number> = {};
  for (const [sourceName, { weightedScore, bestRank, authorityWeight }] of sourceBest) {
    totalWeight += authorityWeight;
    totalScore += weightedScore * authorityWeight;
    bestRanks[sourceName] = bestRank;
  }

  let prestige = totalWeight > 0 ? totalScore / totalWeight : 0;
  const breadthBonus = Math.min(10, (sourceBest.size - 1) * 3.33);
  prestige = Math.min(100, prestige + breadthBonus);

  const score = Math.round(prestige * 100) / 100;
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
