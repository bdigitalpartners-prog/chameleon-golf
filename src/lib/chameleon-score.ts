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

// ──────────────────────────────────────────────────────────
// Dimension-weighted scoring for the CourseRanker UI
// ──────────────────────────────────────────────────────────

/** 9 scoring dimensions used by the Chameleon Score engine */
export type DimensionKey =
  | "design"
  | "conditions"
  | "challenge"
  | "scenery"
  | "value"
  | "amenities"
  | "accessibility"
  | "prestige"
  | "vibe";

export interface DimensionWeights {
  design: number;       // 0-10
  conditions: number;
  challenge: number;
  scenery: number;
  value: number;
  amenities: number;
  accessibility: number;
  prestige: number;
  vibe: number;
}

export interface DimensionScores {
  design: number;       // 0-100
  conditions: number;
  challenge: number;
  scenery: number;
  value: number;
  amenities: number;
  accessibility: number;
  prestige: number;
  vibe: number;
}

export interface CourseScoreResult {
  courseId: number;
  chameleonScore: number;   // final blended score 0-100
  prestigeScore: number;
  dimensionScores: DimensionScores;
  breakdown: { dimension: DimensionKey; weight: number; score: number; contribution: number }[];
}

export const DEFAULT_DIMENSION_WEIGHTS: DimensionWeights = {
  design: 5,
  conditions: 5,
  challenge: 5,
  scenery: 5,
  value: 5,
  amenities: 5,
  accessibility: 5,
  prestige: 5,
  vibe: 5,
};

export const DIMENSION_META: { key: DimensionKey; label: string; icon: string; description: string }[] = [
  { key: "design", label: "Design / Architecture", icon: "Compass", description: "Course design quality and strategic routing" },
  { key: "conditions", label: "Conditions", icon: "Sprout", description: "Maintenance, greens quality, turf health" },
  { key: "challenge", label: "Challenge / Difficulty", icon: "Target", description: "Slope, rating, strategic difficulty" },
  { key: "scenery", label: "Scenery / Aesthetics", icon: "Mountain", description: "Beauty, setting, visual experience" },
  { key: "value", label: "Value", icon: "DollarSign", description: "Quality relative to green fee price" },
  { key: "amenities", label: "Amenities", icon: "Coffee", description: "Practice facilities, pro shop, dining" },
  { key: "accessibility", label: "Accessibility", icon: "DoorOpen", description: "Public vs private, ease of booking" },
  { key: "prestige", label: "Prestige / Reputation", icon: "Award", description: "Expert rankings, history, fame" },
  { key: "vibe", label: "Vibe / Experience", icon: "Smile", description: "Pace of play, atmosphere, service" },
];

export const PRESET_PROFILES: { id: string; label: string; description: string; weights: DimensionWeights }[] = [
  {
    id: "tournament",
    label: "Tournament Pro",
    description: "High Challenge, High Prestige, High Design",
    weights: { design: 9, conditions: 8, challenge: 10, scenery: 4, value: 2, amenities: 3, accessibility: 2, prestige: 10, vibe: 4 },
  },
  {
    id: "weekend",
    label: "Weekend Warrior",
    description: "High Value, High Accessibility, Moderate Challenge",
    weights: { design: 5, conditions: 6, challenge: 5, scenery: 6, value: 10, amenities: 7, accessibility: 10, prestige: 3, vibe: 8 },
  },
  {
    id: "traveler",
    label: "Golf Traveler",
    description: "High Scenery, High Amenities, High Vibe",
    weights: { design: 6, conditions: 5, challenge: 4, scenery: 10, value: 5, amenities: 10, accessibility: 6, prestige: 5, vibe: 10 },
  },
  {
    id: "purist",
    label: "Architecture Purist",
    description: "Max Design, High Conditions, Low Value weight",
    weights: { design: 10, conditions: 9, challenge: 7, scenery: 8, value: 1, amenities: 2, accessibility: 3, prestige: 7, vibe: 5 },
  },
];

/** Expert / User blend ratio (60% expert, 40% user dimensions) */
const EXPERT_BLEND = 0.6;
const USER_BLEND = 0.4;

/**
 * Compute dimension scores for a course from its data.
 * For dimensions without direct data, uses prestige score as proxy.
 */
export function computeDimensionScores(
  course: {
    accessType?: string | null;
    greenFeeLow?: number | string | null;
    greenFeeHigh?: number | string | null;
    practiceFacilities?: unknown;
    walkingPolicy?: string | null;
    yearOpened?: number | null;
    renovationYear?: number | null;
    originalArchitect?: string | null;
    maxSlopeRating?: number | null;
    maxCourseRating?: number | null;
  },
  prestigeScore: number
): DimensionScores {
  const prestige = clamp(prestigeScore, 0, 100);

  // Design: use prestige as base, bonus for renowned architects and renovations
  let design = prestige;
  if (course.renovationYear && course.renovationYear >= 2010) design = Math.min(design + 5, 100);

  // Conditions: proxy from prestige (higher-ranked courses tend to have better conditions)
  const conditions = prestige;

  // Challenge: use slope rating if available
  let challenge = prestige;
  if (course.maxSlopeRating) {
    // Slope ranges from ~55 to ~155. Normalize around 113 (avg) to 155 (max)
    challenge = clamp(((course.maxSlopeRating - 55) / 100) * 100, 0, 100);
  }

  // Scenery: proxy from prestige
  const scenery = prestige;

  // Value: inverse relationship between fee and prestige
  let value = prestige;
  const fee = Number(course.greenFeeHigh || course.greenFeeLow || 0);
  if (fee > 0 && prestige > 0) {
    // Higher prestige per dollar = better value
    const prestigePerDollar = prestige / fee;
    // Normalize: $100 course with prestige 80 = good value
    value = clamp(prestigePerDollar * 125, 0, 100);
  }

  // Amenities: proxy from prestige, boost if has practice facilities
  let amenities = prestige * 0.8;
  if (course.practiceFacilities) amenities = Math.min(amenities + 15, 100);

  // Accessibility: based on access type
  let accessibility = 50; // default mid
  const accessLower = (course.accessType || "").toLowerCase();
  if (accessLower.includes("public")) accessibility = 90;
  else if (accessLower.includes("resort")) accessibility = 70;
  else if (accessLower.includes("semi")) accessibility = 55;
  else if (accessLower.includes("military")) accessibility = 40;
  else if (accessLower.includes("private")) accessibility = 20;

  // Vibe: proxy from prestige
  const vibe = prestige;

  return {
    design: round2(design),
    conditions: round2(conditions),
    challenge: round2(challenge),
    scenery: round2(scenery),
    value: round2(value),
    amenities: round2(amenities),
    accessibility: round2(accessibility),
    prestige: round2(prestige),
    vibe: round2(vibe),
  };
}

/**
 * Compute the final Chameleon Score blending expert prestige with user dimension weights.
 * Pure function — runs on client or server.
 */
export function computeChameleonScore(
  dimensionScores: DimensionScores,
  userWeights: DimensionWeights,
  prestigeScore: number
): { score: number; breakdown: CourseScoreResult["breakdown"] } {
  const keys = Object.keys(dimensionScores) as DimensionKey[];
  const totalWeight = keys.reduce((sum, k) => sum + userWeights[k], 0) || 1;

  let weightedSum = 0;
  const breakdown: CourseScoreResult["breakdown"] = [];

  for (const key of keys) {
    const normalizedWeight = userWeights[key] / totalWeight;
    const dimScore = dimensionScores[key];
    const contribution = normalizedWeight * dimScore;
    weightedSum += contribution;
    breakdown.push({
      dimension: key,
      weight: round2(normalizedWeight * 100),
      score: round2(dimScore),
      contribution: round2(contribution),
    });
  }

  // Blend: 60% expert prestige + 40% user-weighted dimension score
  const blended = EXPERT_BLEND * prestigeScore + USER_BLEND * weightedSum;
  const score = round2(clamp(blended, 0, 100));

  return { score, breakdown };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
