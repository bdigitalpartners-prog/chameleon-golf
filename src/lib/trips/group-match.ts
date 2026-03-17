/**
 * Group Match Score Algorithm
 *
 * Takes an array of user EQ weight profiles and course scoring data,
 * computes individual match scores for each user against the course,
 * then aggregates into an overall group match score (0-100).
 *
 * Considers handicap spread for difficulty calibration:
 *   - A wide handicap spread penalizes courses that skew hard or easy
 *   - A narrow spread means the group can handle similar difficulty
 */

export interface UserEQProfile {
  userId: string;
  userName?: string;
  handicapIndex?: number | null;
  weights: {
    conditioning: number;
    layout: number;
    pace: number;
    aesthetics: number;
    challenge: number;
    value: number;
    amenities: number;
    walkability: number;
    service: number;
    expert: number;
  };
}

export interface CourseScoreData {
  courseId: number;
  courseName: string;
  avgConditioning?: number | null;
  avgLayoutDesign?: number | null;
  avgPace?: number | null;
  avgAesthetics?: number | null;
  avgChallenge?: number | null;
  avgValue?: number | null;
  avgAmenities?: number | null;
  avgWalkability?: number | null;
  avgService?: number | null;
  prestigeScore?: number | null;
  chameleonScore?: number | null;
  slopeRating?: number | null;
}

export interface UserMatchResult {
  userId: string;
  userName?: string;
  matchScore: number;
  dimensionScores: Record<string, number>;
}

export interface GroupMatchResult {
  groupMatchScore: number;
  courseId: number;
  courseName: string;
  userBreakdown: UserMatchResult[];
  handicapSpreadFactor: number;
  consensusLevel: number;
}

const DIMENSION_KEYS = [
  "conditioning",
  "layout",
  "pace",
  "aesthetics",
  "challenge",
  "value",
  "amenities",
  "walkability",
  "service",
] as const;

const COURSE_FIELD_MAP: Record<string, keyof CourseScoreData> = {
  conditioning: "avgConditioning",
  layout: "avgLayoutDesign",
  pace: "avgPace",
  aesthetics: "avgAesthetics",
  challenge: "avgChallenge",
  value: "avgValue",
  amenities: "avgAmenities",
  walkability: "avgWalkability",
  service: "avgService",
};

/**
 * Compute a single user's match score against a course (0-100).
 * The score is a weighted average of the course dimension scores,
 * using the user's EQ weight profile as the weighting.
 */
function computeUserMatchScore(
  profile: UserEQProfile,
  course: CourseScoreData
): UserMatchResult {
  const weights = profile.weights;
  const dimensionScores: Record<string, number> = {};

  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of DIMENSION_KEYS) {
    const courseField = COURSE_FIELD_MAP[dim];
    const courseVal = course[courseField] as number | null | undefined;
    const userWeight = weights[dim] ?? 0;

    // Course dimension scores are on a 1-10 scale; normalize to 0-100
    const normalizedScore = courseVal != null ? (courseVal / 10) * 100 : 50;
    dimensionScores[dim] = Math.round(normalizedScore * 10) / 10;

    weightedSum += normalizedScore * userWeight;
    totalWeight += userWeight;
  }

  // Add expert/prestige component
  const expertWeight = weights.expert ?? 0;
  if (expertWeight > 0) {
    const prestigeNormalized =
      course.prestigeScore != null
        ? Math.min((Number(course.prestigeScore) / 100) * 100, 100)
        : 50;
    dimensionScores["expert"] = Math.round(prestigeNormalized * 10) / 10;
    weightedSum += prestigeNormalized * expertWeight;
    totalWeight += expertWeight;
  }

  const matchScore =
    totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 50;

  return {
    userId: profile.userId,
    userName: profile.userName,
    matchScore: Math.min(100, Math.max(0, matchScore)),
    dimensionScores,
  };
}

/**
 * Calculate handicap spread factor (0-1).
 * A narrow spread (everyone similar skill) yields a factor close to 1.
 * A wide spread penalizes the score slightly.
 */
function computeHandicapSpreadFactor(profiles: UserEQProfile[]): number {
  const handicaps = profiles
    .map((p) => p.handicapIndex)
    .filter((h): h is number => h != null);

  if (handicaps.length < 2) return 1.0;

  const min = Math.min(...handicaps);
  const max = Math.max(...handicaps);
  const spread = max - min;

  // A spread of 0 = perfect (factor 1.0)
  // A spread of 30+ = significant penalty (factor ~0.85)
  const factor = Math.max(0.85, 1.0 - spread * 0.005);
  return Math.round(factor * 1000) / 1000;
}

/**
 * Calculate consensus level (0-1).
 * How much the group agrees on this course being a good match.
 * High consensus = everyone scored similarly, low = polarizing.
 */
function computeConsensusLevel(userResults: UserMatchResult[]): number {
  if (userResults.length < 2) return 1.0;

  const scores = userResults.map((r) => r.matchScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // A std dev of 0 = perfect consensus (1.0)
  // A std dev of 25+ = very polarizing (~0.5)
  const consensus = Math.max(0.5, 1.0 - stdDev / 50);
  return Math.round(consensus * 1000) / 1000;
}

/**
 * Main function: compute group match score for a set of users and a course.
 */
export function computeGroupMatchScore(
  profiles: UserEQProfile[],
  course: CourseScoreData
): GroupMatchResult {
  if (profiles.length === 0) {
    return {
      groupMatchScore: 0,
      courseId: course.courseId,
      courseName: course.courseName,
      userBreakdown: [],
      handicapSpreadFactor: 1,
      consensusLevel: 1,
    };
  }

  // Compute individual match scores
  const userResults = profiles.map((p) => computeUserMatchScore(p, course));

  // Average individual scores
  const avgScore =
    userResults.reduce((sum, r) => sum + r.matchScore, 0) / userResults.length;

  // Handicap spread factor
  const handicapSpreadFactor = computeHandicapSpreadFactor(profiles);

  // Consensus level
  const consensusLevel = computeConsensusLevel(userResults);

  // Final group match score: base average * handicap factor * consensus boost
  // Consensus above 0.8 gives a small bonus, below penalizes
  const consensusMultiplier = 0.9 + consensusLevel * 0.1;
  const rawGroupScore = avgScore * handicapSpreadFactor * consensusMultiplier;
  const groupMatchScore =
    Math.round(Math.min(100, Math.max(0, rawGroupScore)) * 10) / 10;

  return {
    groupMatchScore,
    courseId: course.courseId,
    courseName: course.courseName,
    userBreakdown: userResults,
    handicapSpreadFactor,
    consensusLevel,
  };
}
