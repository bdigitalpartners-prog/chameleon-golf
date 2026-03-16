import prisma from "./prisma";
import { computeAllPrestigeScores } from "./chameleon-score";

/**
 * Architect tier mapping — higher tier = higher architecture score.
 * Golden Age and renowned modern architects get higher scores.
 */
const ARCHITECT_TIERS: Record<string, number> = {
  // Tier 1 — Golden Age legends (9-10)
  "alister mackenzie": 10,
  "a.w. tillinghast": 10,
  "c.b. macdonald": 10,
  "charles blair macdonald": 10,
  "seth raynor": 9.5,
  "donald ross": 10,
  "hugh wilson": 9.5,
  "george crump": 9.5,
  "george c. thomas": 9.5,
  "a.h. colt": 9,
  "harry colt": 9,
  "h.s. colt": 9,
  // Tier 2 — Modern masters (8-9)
  "pete dye": 9,
  "tom doak": 9,
  "bill coore": 9,
  "ben crenshaw": 9,
  "coore & crenshaw": 9.5,
  "coore/crenshaw": 9.5,
  "gil hanse": 9,
  "mike strantz": 9,
  // Tier 3 — Renowned architects (7-8)
  "tom fazio": 8,
  "jack nicklaus": 8,
  "robert trent jones": 8,
  "robert trent jones sr": 8,
  "robert trent jones jr": 7.5,
  "rees jones": 7.5,
  "arnold palmer": 7.5,
  "arthur hills": 7,
  "gary player": 7,
  "ben crenshaw & bill coore": 9.5,
  "perry maxwell": 9,
  "dick wilson": 8,
  "george fazio": 7.5,
  "william flynn": 9,
  "william s. flynn": 9,
  "bobby jones": 8.5,
  // Tier 4 — Solid architects (6-7)
  "jerry pate": 6.5,
  "tom weiskopf": 7,
  "jay morrish": 6.5,
  "peter jacobsen": 6,
  "ron garl": 6,
  "dan maples": 6,
  "brian silva": 7,
  "keith foster": 7.5,
  "todd eckenrode": 6.5,
  "rod whitman": 7.5,
  "david mclay kidd": 8,
  "beau welling": 7,
  "bill bergin": 6.5,
  "tripp davis": 7,
  "lester george": 7,
  "andrew green": 7.5,
};

/**
 * States/regions known for scenic golf settings.
 */
const SCENIC_STATES: Record<string, number> = {
  Hawaii: 9.5,
  California: 8,
  Oregon: 8,
  "South Carolina": 7.5,
  "North Carolina": 7.5,
  Arizona: 8,
  Colorado: 8.5,
  Montana: 8.5,
  Florida: 6.5,
  Georgia: 7,
  Michigan: 7,
  Maine: 8,
  "New York": 7,
  Virginia: 7,
  Scotland: 9.5,
  Ireland: 9.5,
  "Northern Ireland": 9.5,
  England: 8,
  Wales: 8,
  "New Zealand": 9,
  Australia: 8,
};

/**
 * Course style aesthetics multiplier.
 */
const STYLE_AESTHETICS: Record<string, number> = {
  Links: 9,
  links: 9,
  Parkland: 6.5,
  parkland: 6.5,
  Desert: 8,
  desert: 8,
  Mountain: 8.5,
  mountain: 8.5,
  Heathland: 8,
  heathland: 8,
  Coastal: 9,
  coastal: 9,
  "Links-style": 8,
  "links-style": 8,
  Woodland: 7,
  woodland: 7,
  Prairie: 7,
  prairie: 7,
  Tropical: 7.5,
  tropical: 7.5,
};

interface CourseData {
  courseId: number;
  courseName: string;
  courseType: string | null;
  accessType: string | null;
  courseStyle: string | null;
  state: string | null;
  country: string;
  originalArchitect: string | null;
  yearOpened: number | null;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  walkingPolicy: string | null;
  par: number | null;
  practiceFacilities: unknown;
  numHoles: number | null;
  fairwayGrass: string | null;
  greenGrass: string | null;
  greenSpeed: string | null;
  bestConditionMonths: string | null;
  // Tee box data (champion tees)
  maxSlopeRating: number | null;
  maxCourseRating: number | null;
  maxYardage: number | null;
  // Ranking data
  numLists: number;
  prestigeScore: number;
}

/**
 * Compute Architecture score (0-10).
 * Factors: architect reputation, course age, design awards proxy.
 */
function computeArchitecture(c: CourseData): number {
  let score = 5.0; // baseline

  // Architect reputation (strongest signal)
  if (c.originalArchitect) {
    const archLower = c.originalArchitect.toLowerCase().trim();
    // Check direct match
    if (ARCHITECT_TIERS[archLower] !== undefined) {
      score = ARCHITECT_TIERS[archLower];
    } else {
      // Check partial match (e.g. "Tom Fazio/Tom Fazio II")
      for (const [name, tier] of Object.entries(ARCHITECT_TIERS)) {
        if (archLower.includes(name)) {
          score = Math.max(score, tier);
          break;
        }
      }
    }
  } else {
    score = 4.0; // Unknown architect
  }

  // Age bonus — Golden Age courses (pre-1940) get a boost
  if (c.yearOpened) {
    if (c.yearOpened < 1930) score = Math.min(10, score + 0.5);
    else if (c.yearOpened < 1945) score = Math.min(10, score + 0.3);
    else if (c.yearOpened < 1970) score = Math.min(10, score + 0.1);
  }

  // Prestige correlation — highly ranked courses have validated architecture
  if (c.prestigeScore > 80) score = Math.min(10, score + 0.3);
  else if (c.prestigeScore > 50) score = Math.min(10, score + 0.15);

  return clamp(score);
}

/**
 * Compute Challenge score (0-10).
 * Factors: slope rating, course rating, yardage, par.
 */
function computeChallenge(c: CourseData): number {
  const components: number[] = [];

  // Slope rating (55-155 scale, 113 is standard)
  if (c.maxSlopeRating) {
    // Map: 100=3, 113=5, 130=7, 140=8.5, 150+=10
    const slopeScore = mapRange(c.maxSlopeRating, 100, 155, 3, 10);
    components.push(slopeScore);
  }

  // Course rating relative to par
  if (c.maxCourseRating && c.par) {
    const overPar = c.maxCourseRating - c.par;
    // 0 over = 5, 2 over = 6.5, 5 over = 8, 8+ over = 10
    const ratingScore = mapRange(overPar, -2, 10, 3, 10);
    components.push(ratingScore);
  }

  // Yardage (for 18-hole courses)
  if (c.maxYardage && (c.numHoles === 18 || c.numHoles === null)) {
    // 6000=4, 6800=6, 7200=7.5, 7600+=9
    const yardScore = mapRange(c.maxYardage, 5800, 7800, 3, 9.5);
    components.push(yardScore);
  }

  if (components.length === 0) return 5.0;
  return clamp(avg(components));
}

/**
 * Compute Aesthetics score (0-10).
 * Factors: location, course style, scenic potential.
 */
function computeAesthetics(c: CourseData): number {
  let score = 5.5;

  // Course style
  if (c.courseStyle) {
    const styleScore = STYLE_AESTHETICS[c.courseStyle];
    if (styleScore !== undefined) {
      score = styleScore;
    }
  }

  // Location
  const region = c.state || c.country;
  if (region && SCENIC_STATES[region] !== undefined) {
    const locationScore = SCENIC_STATES[region];
    score = (score * 0.6) + (locationScore * 0.4);
  }

  // Prestige correlation — top-ranked courses tend to be visually striking
  if (c.prestigeScore > 70) score = Math.min(10, score + 0.4);
  else if (c.prestigeScore > 40) score = Math.min(10, score + 0.2);

  // Coastal/island locations bonus
  if (c.state === "Hawaii" || c.courseStyle?.toLowerCase().includes("links")) {
    score = Math.min(10, score + 0.3);
  }

  return clamp(score);
}

/**
 * Compute Conditioning score (0-10).
 * Factors: course type (private better), fee level, grass types, prestige.
 */
function computeConditioning(c: CourseData): number {
  let score = 5.0;

  // Access type — private courses typically have better conditioning
  if (c.accessType) {
    const at = c.accessType.toLowerCase();
    if (at.includes("private")) score = 7.5;
    else if (at.includes("resort")) score = 7.0;
    else if (at.includes("semi-private") || at.includes("semi private")) score = 6.0;
    else if (at.includes("public") || at.includes("municipal")) score = 5.0;
  }

  // Fee level — higher green fees generally correlate with better conditioning
  if (c.greenFeeHigh) {
    const fee = c.greenFeeHigh;
    if (fee >= 500) score = Math.max(score, 9.0);
    else if (fee >= 300) score = Math.max(score, 8.0);
    else if (fee >= 200) score = Math.max(score, 7.0);
    else if (fee >= 100) score = Math.max(score, 6.0);
  }

  // Grass type indicators
  if (c.greenGrass) {
    const grass = c.greenGrass.toLowerCase();
    if (grass.includes("bent")) score = Math.min(10, score + 0.5);
    if (grass.includes("fescue")) score = Math.min(10, score + 0.3);
  }

  // Green speed info suggests attention to detail
  if (c.greenSpeed) score = Math.min(10, score + 0.3);

  // Prestige correlation
  if (c.prestigeScore > 80) score = Math.min(10, score + 0.5);
  else if (c.prestigeScore > 50) score = Math.min(10, score + 0.3);

  return clamp(score);
}

/**
 * Compute Value score (0-10).
 * Inverse of fee relative to quality — great courses at low price = high value.
 */
function computeValue(c: CourseData): number {
  // Private courses with no green fee — score as mid-value
  if (c.accessType?.toLowerCase().includes("private") && !c.greenFeeLow) {
    return 5.0;
  }

  if (!c.greenFeeLow && !c.greenFeeHigh) return 5.0;

  const fee = c.greenFeeLow || c.greenFeeHigh || 0;

  // Quality proxy from prestige + conditioning baseline
  const qualityProxy = Math.min(10, (c.prestigeScore / 10) + 2);

  // Fee bands: under $50 = excellent value, $50-100 = good, $100-200 = fair, $200-400 = low, $400+ = very low
  let feeScore: number;
  if (fee <= 30) feeScore = 9.5;
  else if (fee <= 50) feeScore = 8.5;
  else if (fee <= 80) feeScore = 7.5;
  else if (fee <= 120) feeScore = 6.5;
  else if (fee <= 200) feeScore = 5.0;
  else if (fee <= 350) feeScore = 3.5;
  else if (fee <= 500) feeScore = 2.5;
  else feeScore = 1.5;

  // Adjust value up if quality is high relative to price
  const qualityFeeRatio = qualityProxy / (fee / 100 + 1);
  const adjustedValue = (feeScore * 0.7) + (Math.min(10, qualityFeeRatio * 2) * 0.3);

  return clamp(adjustedValue);
}

/**
 * Compute Walkability score (0-10).
 * Factors: walking policy, course style, terrain hints.
 */
function computeWalkability(c: CourseData): number {
  let score = 5.0;

  // Walking policy is the strongest signal
  if (c.walkingPolicy) {
    const wp = c.walkingPolicy.toLowerCase();
    if (wp.includes("walking only") || wp.includes("walking-only") || wp === "walking") {
      score = 9.5;
    } else if (wp.includes("encouraged") || wp.includes("unrestricted") || wp.includes("anytime")) {
      score = 8.0;
    } else if (wp.includes("allowed") || wp.includes("permitted") || wp.includes("yes")) {
      score = 6.5;
    } else if (wp.includes("restricted") || wp.includes("certain times") || wp.includes("limited")) {
      score = 4.0;
    } else if (wp.includes("mandatory cart") || wp.includes("cart required") || wp.includes("no walking") || wp.includes("cart only")) {
      score = 1.5;
    }
  }

  // Course style hints
  if (c.courseStyle) {
    const style = c.courseStyle.toLowerCase();
    if (style.includes("links")) score = Math.min(10, score + 1.0);
    else if (style.includes("parkland")) score = Math.min(10, score + 0.3);
    else if (style.includes("mountain")) score = Math.max(1, score - 0.5);
  }

  return clamp(score);
}

/**
 * Compute Pace of Play score (0-10).
 * Higher score = faster pace. Private/walking courses tend to be faster.
 */
function computePace(c: CourseData): number {
  let score = 5.0;

  // Private courses generally have faster play
  if (c.accessType) {
    const at = c.accessType.toLowerCase();
    if (at.includes("private")) score = 7.5;
    else if (at.includes("resort")) score = 6.0;
    else if (at.includes("semi")) score = 5.5;
    else if (at.includes("public") || at.includes("municipal")) score = 4.5;
  }

  // Walking-only courses tend to play faster
  if (c.walkingPolicy) {
    const wp = c.walkingPolicy.toLowerCase();
    if (wp.includes("walking only") || wp === "walking") {
      score = Math.min(10, score + 1.0);
    }
  }

  // Links courses play faster (fewer trees to lose balls in)
  if (c.courseStyle?.toLowerCase().includes("links")) {
    score = Math.min(10, score + 0.5);
  }

  // Prestige correlation — well-run courses manage pace
  if (c.prestigeScore > 70) score = Math.min(10, score + 0.3);

  return clamp(score);
}

/**
 * Compute Amenities score (0-10).
 * Factors: practice facilities, resort affiliation, fee level as proxy.
 */
function computeAmenities(c: CourseData): number {
  let score = 5.0;

  // Access type
  if (c.accessType) {
    const at = c.accessType.toLowerCase();
    if (at.includes("private")) score = 7.5;
    else if (at.includes("resort")) score = 8.0;
    else if (at.includes("semi")) score = 5.5;
    else if (at.includes("public")) score = 4.5;
  }

  // Practice facilities
  if (c.practiceFacilities) {
    let facilityCount = 0;
    if (Array.isArray(c.practiceFacilities)) {
      facilityCount = c.practiceFacilities.length;
    } else if (typeof c.practiceFacilities === "object" && c.practiceFacilities !== null) {
      facilityCount = Object.keys(c.practiceFacilities).length;
    }
    if (facilityCount > 0) {
      score = Math.min(10, score + Math.min(facilityCount * 0.5, 2.0));
    }
  }

  // Fee level as proxy for facility quality
  if (c.greenFeeHigh) {
    if (c.greenFeeHigh >= 300) score = Math.min(10, score + 0.5);
    else if (c.greenFeeHigh >= 150) score = Math.min(10, score + 0.3);
  }

  return clamp(score);
}

/**
 * Compute Service score (0-10).
 * Proxied from access type and fee level.
 */
function computeService(c: CourseData): number {
  let score = 5.0;

  // Private/resort courses typically have superior service
  if (c.accessType) {
    const at = c.accessType.toLowerCase();
    if (at.includes("private")) score = 8.0;
    else if (at.includes("resort")) score = 7.5;
    else if (at.includes("semi")) score = 6.0;
    else if (at.includes("public")) score = 5.0;
    else if (at.includes("municipal")) score = 4.0;
  }

  // Fee level
  if (c.greenFeeHigh) {
    if (c.greenFeeHigh >= 400) score = Math.max(score, 8.5);
    else if (c.greenFeeHigh >= 200) score = Math.max(score, 7.0);
    else if (c.greenFeeHigh >= 100) score = Math.max(score, 6.0);
  }

  // Prestige correlation
  if (c.prestigeScore > 70) score = Math.min(10, score + 0.5);
  else if (c.prestigeScore > 40) score = Math.min(10, score + 0.2);

  return clamp(score);
}

// --- Helpers ---

function clamp(v: number, min = 0, max = 10): number {
  return Math.round(Math.max(min, Math.min(max, v)) * 100) / 100;
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + ((clamped - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// --- Main computation ---

export interface DimensionScores {
  avgConditioning: number;
  avgLayoutDesign: number;
  avgPace: number;
  avgAesthetics: number;
  avgChallenge: number;
  avgValue: number;
  avgAmenities: number;
  avgWalkability: number;
  avgService: number;
  avgOverall: number;
}

export interface ComputeResult {
  processed: number;
  withPrestige: number;
  withDimensions: number;
  errors: string[];
  durationMs: number;
}

/**
 * Compute and store all dimension scores for all courses.
 */
export async function computeAllDimensionScores(): Promise<ComputeResult> {
  const start = Date.now();
  const errors: string[] = [];

  // 1. Compute prestige scores first
  const prestigeMap = await computeAllPrestigeScores();

  // 2. Fetch all courses with relevant data
  const courses = await prisma.course.findMany({
    select: {
      courseId: true,
      courseName: true,
      courseType: true,
      accessType: true,
      courseStyle: true,
      state: true,
      country: true,
      originalArchitect: true,
      yearOpened: true,
      greenFeeLow: true,
      greenFeeHigh: true,
      walkingPolicy: true,
      par: true,
      practiceFacilities: true,
      numHoles: true,
      fairwayGrass: true,
      greenGrass: true,
      greenSpeed: true,
      bestConditionMonths: true,
      teeBoxes: {
        select: {
          slopeRating: true,
          courseRating: true,
          totalYardage: true,
        },
      },
    },
  });

  // 3. Compute dimension scores for each course
  let withPrestige = 0;
  let withDimensions = 0;
  const upserts: Promise<unknown>[] = [];

  for (const course of courses) {
    try {
      const prestige = prestigeMap.get(course.courseId);
      const prestigeScore = prestige?.score ?? 0;
      if (prestige) withPrestige++;

      // Get champion tee data (max slope/rating/yardage)
      const maxSlope = course.teeBoxes.reduce<number | null>(
        (max, t) => (t.slopeRating && (!max || t.slopeRating > max) ? t.slopeRating : max),
        null
      );
      const maxRating = course.teeBoxes.reduce<number | null>(
        (max, t) => {
          const r = t.courseRating ? Number(t.courseRating) : null;
          return r && (!max || r > max) ? r : max;
        },
        null
      );
      const maxYardage = course.teeBoxes.reduce<number | null>(
        (max, t) => (t.totalYardage && (!max || t.totalYardage > max) ? t.totalYardage : max),
        null
      );

      const data: CourseData = {
        courseId: course.courseId,
        courseName: course.courseName,
        courseType: course.courseType,
        accessType: course.accessType,
        courseStyle: course.courseStyle,
        state: course.state,
        country: course.country,
        originalArchitect: course.originalArchitect,
        yearOpened: course.yearOpened,
        greenFeeLow: course.greenFeeLow ? Number(course.greenFeeLow) : null,
        greenFeeHigh: course.greenFeeHigh ? Number(course.greenFeeHigh) : null,
        walkingPolicy: course.walkingPolicy,
        par: course.par,
        practiceFacilities: course.practiceFacilities,
        numHoles: course.numHoles,
        fairwayGrass: course.fairwayGrass,
        greenGrass: course.greenGrass,
        greenSpeed: course.greenSpeed,
        bestConditionMonths: course.bestConditionMonths,
        maxSlopeRating: maxSlope,
        maxCourseRating: maxRating,
        maxYardage: maxYardage,
        numLists: prestige?.numLists ?? 0,
        prestigeScore,
      };

      const dims: DimensionScores = {
        avgLayoutDesign: computeArchitecture(data),
        avgChallenge: computeChallenge(data),
        avgAesthetics: computeAesthetics(data),
        avgConditioning: computeConditioning(data),
        avgValue: computeValue(data),
        avgWalkability: computeWalkability(data),
        avgPace: computePace(data),
        avgAmenities: computeAmenities(data),
        avgService: computeService(data),
        avgOverall: 0,
      };

      // Compute overall as average of all dimensions + prestige (normalized to 0-10)
      const allScores = [
        dims.avgLayoutDesign,
        dims.avgChallenge,
        dims.avgAesthetics,
        dims.avgConditioning,
        dims.avgValue,
        dims.avgWalkability,
        dims.avgPace,
        dims.avgAmenities,
        dims.avgService,
        Math.min(10, prestigeScore / 10), // normalize 0-100 prestige to 0-10
      ];
      dims.avgOverall = clamp(avg(allScores));
      withDimensions++;

      // Build best rank fields from prestige data
      const bestRanks = prestige?.bestRanks ?? {};
      const rankFields = getBestRankFields(bestRanks);

      upserts.push(
        prisma.chameleonScore.upsert({
          where: { courseId: course.courseId },
          update: {
            chameleonScore: prestigeScore,
            prestigeScore: prestigeScore,
            numListsAppeared: prestige?.numLists ?? 0,
            avgConditioning: dims.avgConditioning,
            avgLayoutDesign: dims.avgLayoutDesign,
            avgPace: dims.avgPace,
            avgAesthetics: dims.avgAesthetics,
            avgChallenge: dims.avgChallenge,
            avgValue: dims.avgValue,
            avgAmenities: dims.avgAmenities,
            avgWalkability: dims.avgWalkability,
            avgService: dims.avgService,
            avgOverall: dims.avgOverall,
            bestRankGolfDigest: rankFields.bestRankGolfDigest,
            bestRankGolfweek: rankFields.bestRankGolfweek,
            bestRankGolfMag: rankFields.bestRankGolfMag,
            bestRankTop100gc: rankFields.bestRankTop100gc,
            computedAt: new Date(),
          },
          create: {
            courseId: course.courseId,
            chameleonScore: prestigeScore,
            prestigeScore: prestigeScore,
            numListsAppeared: prestige?.numLists ?? 0,
            avgConditioning: dims.avgConditioning,
            avgLayoutDesign: dims.avgLayoutDesign,
            avgPace: dims.avgPace,
            avgAesthetics: dims.avgAesthetics,
            avgChallenge: dims.avgChallenge,
            avgValue: dims.avgValue,
            avgAmenities: dims.avgAmenities,
            avgWalkability: dims.avgWalkability,
            avgService: dims.avgService,
            avgOverall: dims.avgOverall,
            bestRankGolfDigest: rankFields.bestRankGolfDigest,
            bestRankGolfweek: rankFields.bestRankGolfweek,
            bestRankGolfMag: rankFields.bestRankGolfMag,
            bestRankTop100gc: rankFields.bestRankTop100gc,
          },
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Course ${course.courseId} (${course.courseName}): ${msg}`);
    }
  }

  // Batch in chunks of 50
  for (let i = 0; i < upserts.length; i += 50) {
    await Promise.all(upserts.slice(i, i + 50));
  }

  return {
    processed: courses.length,
    withPrestige,
    withDimensions,
    errors,
    durationMs: Date.now() - start,
  };
}

/**
 * Map source names to best-rank DB field helpers.
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
 * Get computation status — how many courses have scores computed.
 */
export async function getScoreStatus(): Promise<{
  totalCourses: number;
  coursesWithScores: number;
  coursesWithDimensions: number;
  coursesWithPrestige: number;
  lastComputedAt: Date | null;
}> {
  const [totalCourses, coursesWithScores, coursesWithDimensions, coursesWithPrestige, lastComputed] =
    await Promise.all([
      prisma.course.count(),
      prisma.chameleonScore.count(),
      prisma.chameleonScore.count({
        where: { avgOverall: { not: null } },
      }),
      prisma.chameleonScore.count({
        where: { prestigeScore: { not: null, gt: 0 } },
      }),
      prisma.chameleonScore.findFirst({
        orderBy: { computedAt: "desc" },
        select: { computedAt: true },
      }),
    ]);

  return {
    totalCourses,
    coursesWithScores,
    coursesWithDimensions,
    coursesWithPrestige,
    lastComputedAt: lastComputed?.computedAt ?? null,
  };
}
