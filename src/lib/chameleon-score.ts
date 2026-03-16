/**
 * golfEQUALIZER — Client-safe Score Types & Pure Functions
 * =========================================================
 * Shared types, dimension metadata, preset profiles, and pure scoring
 * functions used by client components (CourseRanker) and server code.
 *
 * NO Prisma / DB imports — safe for "use client" bundles.
 * Server-only DB operations live in chameleon-score-server.ts.
 */

// ── Dimension keys ──────────────────────────────────────────────────────────

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

export type DimensionWeights = Record<DimensionKey, number>;
export type DimensionScores = Record<DimensionKey, number>;

// ── Default weights (all equal at 5) ────────────────────────────────────────

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

// ── Dimension metadata for UI ───────────────────────────────────────────────

export const DIMENSION_META: {
  key: DimensionKey;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: "design",
    label: "Design / Layout",
    icon: "Compass",
    description: "Architecture, routing, strategic variety, and design pedigree",
  },
  {
    key: "conditions",
    label: "Conditions",
    icon: "Sprout",
    description: "Turf quality, green speed, maintenance, and course presentation",
  },
  {
    key: "challenge",
    label: "Challenge",
    icon: "Target",
    description: "Slope/course rating, strategic demand, risk-reward balance",
  },
  {
    key: "scenery",
    label: "Scenery / Aesthetics",
    icon: "Mountain",
    description: "Visual beauty, landscape setting, and wow factor",
  },
  {
    key: "value",
    label: "Value",
    icon: "DollarSign",
    description: "Quality relative to green fee — bang for the buck",
  },
  {
    key: "amenities",
    label: "Amenities",
    icon: "Coffee",
    description: "Practice facilities, clubhouse, dining, pro shop",
  },
  {
    key: "accessibility",
    label: "Accessibility / Walkability",
    icon: "DoorOpen",
    description: "Walking policy, terrain, ease of access for all golfers",
  },
  {
    key: "prestige",
    label: "Prestige / Rankings",
    icon: "Award",
    description: "Expert ranking authority — Golf Digest, Golfweek, GOLF Mag, Top100GC",
  },
  {
    key: "vibe",
    label: "Vibe / Service",
    icon: "Smile",
    description: "Staff friendliness, pace management, overall atmosphere",
  },
];

// ── Preset weight profiles ──────────────────────────────────────────────────

export const PRESET_PROFILES: {
  id: string;
  label: string;
  description: string;
  weights: DimensionWeights;
}[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Equal weight across all dimensions",
    weights: { ...DEFAULT_DIMENSION_WEIGHTS },
  },
  {
    id: "purist",
    label: "Purist",
    description: "Prioritize design, challenge, and conditions",
    weights: {
      design: 9,
      conditions: 8,
      challenge: 9,
      scenery: 5,
      value: 2,
      amenities: 2,
      accessibility: 3,
      prestige: 7,
      vibe: 3,
    },
  },
  {
    id: "bucket-list",
    label: "Bucket List",
    description: "Famous, prestigious, visually stunning courses",
    weights: {
      design: 7,
      conditions: 5,
      challenge: 4,
      scenery: 9,
      value: 2,
      amenities: 6,
      accessibility: 3,
      prestige: 10,
      vibe: 6,
    },
  },
  {
    id: "value-seeker",
    label: "Value Seeker",
    description: "Best quality relative to price",
    weights: {
      design: 6,
      conditions: 7,
      challenge: 5,
      scenery: 5,
      value: 10,
      amenities: 4,
      accessibility: 7,
      prestige: 2,
      vibe: 5,
    },
  },
  {
    id: "weekend-warrior",
    label: "Weekend Warrior",
    description: "Great experience, walkable, good amenities",
    weights: {
      design: 5,
      conditions: 7,
      challenge: 4,
      scenery: 7,
      value: 6,
      amenities: 8,
      accessibility: 9,
      prestige: 3,
      vibe: 8,
    },
  },
];

// ── Pure scoring functions (client-safe) ────────────────────────────────────

interface CourseDataForScoring {
  accessType: string | null;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  practiceFacilities: unknown;
  walkingPolicy: string | null;
  yearOpened: number | null;
  renovationYear: number | null;
  originalArchitect: string | null;
  maxSlopeRating: number | null;
  maxCourseRating: number | null;
}

/**
 * Heuristically compute dimension scores (0–100) from raw course data.
 * Used as fallback when pre-computed DB scores are unavailable.
 */
export function computeDimensionScores(
  course: CourseDataForScoring,
  prestigeScore: number
): DimensionScores {
  // Design: prestigious architects + age + renovations signal good design
  let design = 50;
  if (course.originalArchitect) {
    const arch = course.originalArchitect.toLowerCase();
    const eliteArchitects = [
      "alister mackenzie", "a.w. tillinghast", "donald ross", "c.b. macdonald",
      "seth raynor", "pete dye", "jack nicklaus", "tom fazio", "robert trent jones",
      "tom doak", "bill coore", "ben crenshaw", "gil hanse", "george thomas",
    ];
    if (eliteArchitects.some((a) => arch.includes(a))) design += 25;
    else design += 10;
  }
  if (course.yearOpened && course.yearOpened < 1940) design += 10;
  if (course.renovationYear && course.renovationYear > 2010) design += 5;
  design = Math.min(100, Math.max(0, design));

  // Conditions: proxy from prestige (higher-ranked courses tend to be well-maintained)
  const conditions = Math.min(100, Math.max(20, 40 + prestigeScore * 0.5));

  // Challenge: slope/course rating
  let challenge = 50;
  if (course.maxSlopeRating) {
    challenge = Math.min(100, Math.max(20, ((course.maxSlopeRating - 100) / 55) * 100));
  }
  if (course.maxCourseRating && course.maxCourseRating > 74) {
    challenge = Math.min(100, challenge + 10);
  }

  // Scenery: proxy — links/mountain courses score higher
  const scenery = Math.min(100, Math.max(30, 45 + prestigeScore * 0.4));

  // Value: inverse relationship with green fees
  let value = 50;
  const fee = course.greenFeeHigh ?? course.greenFeeLow;
  if (fee != null) {
    if (fee <= 75) value = 90;
    else if (fee <= 150) value = 70;
    else if (fee <= 300) value = 50;
    else if (fee <= 500) value = 30;
    else value = 15;
    // Boost value if prestige is high relative to fee
    if (prestigeScore > 60 && fee < 200) value = Math.min(100, value + 15);
  }

  // Amenities: practice facilities + access type (resorts tend to have more)
  let amenities = 50;
  if (course.practiceFacilities) {
    const pf = typeof course.practiceFacilities === "string"
      ? course.practiceFacilities
      : JSON.stringify(course.practiceFacilities);
    const facilityCount = (pf.match(/range|putting|chipping|bunker|short game|simulator/gi) || []).length;
    amenities = Math.min(100, 40 + facilityCount * 12);
  }
  if (course.accessType?.toLowerCase().includes("resort")) amenities = Math.min(100, amenities + 15);

  // Accessibility: walking policy + public/private
  let accessibility = 50;
  const wp = (course.walkingPolicy || "").toLowerCase();
  if (wp.includes("walking only") || wp.includes("unrestricted walking")) accessibility = 90;
  else if (wp.includes("walking allowed")) accessibility = 70;
  else if (wp.includes("cart") && wp.includes("required")) accessibility = 25;
  if (course.accessType) {
    const at = course.accessType.toLowerCase();
    if (at.includes("public") || at.includes("municipal")) accessibility = Math.min(100, accessibility + 10);
    else if (at.includes("private")) accessibility = Math.max(0, accessibility - 15);
  }

  // Prestige: direct from prestige score
  const prestige = Math.min(100, Math.max(0, prestigeScore));

  // Vibe: proxy — combination of prestige and accessibility
  const vibe = Math.min(100, Math.max(30, (prestige * 0.4 + accessibility * 0.3 + amenities * 0.3)));

  return { design, conditions, challenge, scenery, value, amenities, accessibility, prestige, vibe };
}

/**
 * Compute the final Chameleon Score from dimension scores + user weights.
 * Returns the overall score (0–100) and per-dimension breakdown.
 */
export function computeChameleonScore(
  dimScores: DimensionScores,
  weights: DimensionWeights,
  prestigeScore: number
): {
  score: number;
  breakdown: { dimension: DimensionKey; weight: number; score: number; contribution: number }[];
} {
  const dims = Object.keys(dimScores) as DimensionKey[];
  const totalWeight = dims.reduce((sum, k) => sum + (weights[k] || 0), 0);
  if (totalWeight === 0) {
    return {
      score: prestigeScore,
      breakdown: dims.map((d) => ({ dimension: d, weight: 0, score: dimScores[d], contribution: 0 })),
    };
  }

  const breakdown = dims.map((d) => {
    const w = weights[d] || 0;
    const pct = (w / totalWeight) * 100;
    const contribution = (w / totalWeight) * dimScores[d];
    return { dimension: d, weight: pct, score: dimScores[d], contribution };
  });

  const score = breakdown.reduce((sum, b) => sum + b.contribution, 0);

  return { score: Math.round(score * 100) / 100, breakdown };
}
