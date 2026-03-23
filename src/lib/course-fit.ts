/**
 * Course-Fit Score Algorithm
 * Calculates a personalized match percentage between a user's golf profile and a course.
 */

interface GolfProfile {
  handicap_range: string | null;
  preferred_style: string | null; // JSON array
  preferred_terrain: string | null;
  walking_preference: string | null;
  budget_range: string | null;
  values_most: string | null; // JSON array of top 3
  home_latitude: number | null;
  home_longitude: number | null;
}

interface CourseData {
  courseId: number;
  courseStyle: string | null;
  accessType: string | null;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  walkingPolicy: string | null;
  latitude: number | null;
  longitude: number | null;
  par: number | null;
  slopeRating: number | null;
  courseRating: number | null;
  // Value-related fields from enrichment
  conditioningScore: number | null;
  layoutScore: number | null;
  aestheticsScore: number | null;
  challengeScore: number | null;
  valueScore: number | null;
  walkabilityScore: number | null;
  terrainDifficulty: string | null;
}

interface FitBreakdown {
  style_match: number;
  budget_match: number;
  terrain_match: number;
  value_match: number;
  location_match: number;
  handicap_match: number;
}

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function calculateStyleMatch(profile: GolfProfile, course: CourseData): number {
  const preferred = parseJsonArray(profile.preferred_style);
  if (preferred.length === 0) return 70; // neutral if no preference
  const courseStyle = (course.courseStyle || "").toLowerCase();
  if (!courseStyle) return 50;
  const match = preferred.some(
    (s) => courseStyle.includes(s.toLowerCase()) || s.toLowerCase().includes(courseStyle)
  );
  return match ? 100 : 30;
}

function calculateBudgetMatch(profile: GolfProfile, course: CourseData): number {
  if (!profile.budget_range) return 70;
  const avgFee = course.greenFeeHigh && course.greenFeeLow
    ? (course.greenFeeHigh + course.greenFeeLow) / 2
    : course.greenFeeHigh || course.greenFeeLow || null;
  if (avgFee === null) return 60;

  const budgetRanges: Record<string, [number, number]> = {
    under_50: [0, 50],
    "50_100": [50, 100],
    "100_200": [100, 200],
    "200_500": [200, 500],
    "500_plus": [500, 10000],
  };
  const range = budgetRanges[profile.budget_range];
  if (!range) return 60;

  if (avgFee >= range[0] && avgFee <= range[1]) return 100;
  // Slightly over budget
  if (avgFee <= range[1] * 1.25) return 70;
  // Way over budget
  if (avgFee > range[1] * 2) return 10;
  // Under budget is fine
  if (avgFee < range[0]) return 85;
  return 40;
}

function calculateTerrainMatch(profile: GolfProfile, course: CourseData): number {
  if (!profile.walking_preference) return 70;
  const walkPolicy = (course.walkingPolicy || "").toLowerCase();
  const terrain = (course.terrainDifficulty || "").toLowerCase();

  const walkingPrefs: Record<string, number> = {
    walking_only: walkPolicy.includes("not_allowed") || walkPolicy.includes("cart") ? 10 : 90,
    prefer_walking: walkPolicy.includes("not_allowed") ? 30 : 80,
    no_preference: 70,
    prefer_cart: 70,
  };

  let score = walkingPrefs[profile.walking_preference] || 70;

  // Adjust for terrain if user prefers walking
  if (profile.preferred_terrain) {
    if (terrain && terrain === profile.preferred_terrain.toLowerCase()) {
      score = Math.min(100, score + 15);
    }
  }
  return score;
}

function calculateValueMatch(profile: GolfProfile, course: CourseData): number {
  const topValues = parseJsonArray(profile.values_most);
  if (topValues.length === 0) return 70;

  const courseScores: Record<string, number | null> = {
    conditioning: course.conditioningScore,
    challenge: course.challengeScore,
    scenery: course.aestheticsScore,
    value: course.valueScore,
    walkability: course.walkabilityScore,
    history: course.layoutScore, // approximate
    exclusivity: course.accessType === "Member Only" ? 90 : 40,
  };

  let total = 0;
  let count = 0;
  for (const v of topValues) {
    const key = v.toLowerCase();
    const score = courseScores[key];
    if (score !== null && score !== undefined) {
      total += Math.min(100, score);
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 60;
}

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateLocationMatch(profile: GolfProfile, course: CourseData): number {
  if (!profile.home_latitude || !profile.home_longitude) return 70;
  if (!course.latitude || !course.longitude) return 60;

  const dist = haversineDistance(
    profile.home_latitude, profile.home_longitude,
    course.latitude, course.longitude
  );

  if (dist < 50) return 100;
  if (dist < 100) return 90;
  if (dist < 250) return 75;
  if (dist < 500) return 60;
  if (dist < 1000) return 40;
  return 25;
}

function calculateHandicapMatch(profile: GolfProfile, course: CourseData): number {
  if (!profile.handicap_range) return 70;

  const handicapMidpoints: Record<string, number> = {
    "0-5": 3,
    "5-10": 7,
    "10-15": 12,
    "15-20": 17,
    "20-30": 25,
    "30+": 35,
  };

  const mid = handicapMidpoints[profile.handicap_range];
  if (mid === undefined) return 70;

  const slope = course.slopeRating || 125;
  // Higher slope = harder course
  // Low handicap players enjoy hard courses, high handicap players prefer easier
  if (mid <= 5) {
    // Scratch players: prefer challenging
    return slope >= 135 ? 95 : slope >= 120 ? 80 : 60;
  }
  if (mid <= 15) {
    // Mid handicap: moderate courses
    return slope >= 110 && slope <= 140 ? 90 : 65;
  }
  // High handicap: prefer easier
  return slope <= 130 ? 85 : slope <= 140 ? 65 : 40;
}

export function calculateCourseFitScore(
  profile: GolfProfile,
  course: CourseData
): { fit_score: number; breakdown: FitBreakdown } {
  const breakdown: FitBreakdown = {
    style_match: calculateStyleMatch(profile, course),
    budget_match: calculateBudgetMatch(profile, course),
    terrain_match: calculateTerrainMatch(profile, course),
    value_match: calculateValueMatch(profile, course),
    location_match: calculateLocationMatch(profile, course),
    handicap_match: calculateHandicapMatch(profile, course),
  };

  const fit_score = Math.round(
    breakdown.style_match * 0.25 +
    breakdown.budget_match * 0.20 +
    breakdown.terrain_match * 0.15 +
    breakdown.value_match * 0.15 +
    breakdown.location_match * 0.10 +
    breakdown.handicap_match * 0.15
  );

  return { fit_score: Math.min(100, Math.max(0, fit_score)), breakdown };
}
