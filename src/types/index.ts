export interface CourseCard {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string;
  courseStyle: string | null;
  courseType: string | null;
  accessType: string | null;
  par: number | null;
  numHoles: number | null;
  yearOpened: number | null;
  originalArchitect: string | null;
  greenFeeLow: string | null;
  greenFeeHigh: string | null;
  walkingPolicy: string | null;
  numListsAppeared: number | null;
  chameleonScore: number | null;
  prestigeScore: string | null;
  primaryImageUrl: string | null;
  bestRank: number | null;
  bestSource: string | null;
  rankings: { rank: number; list: string; source: string }[];
}

export interface CourseFilters {
  search?: string;
  country?: string;
  state?: string;
  courseStyle?: string;
  accessType?: string;
  feeMin?: number;
  feeMax?: number;
  maxAirportDistance?: number;
  rankingSource?: string;
  sortBy?: "chameleon" | "name" | "rank" | "fee";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface FilterWeights {
  rankingWeight: number;
  conditionWeight: number;
  designWeight: number;
  valueWeight: number;
  ambienceWeight: number;
  difficultyWeight: number;
}

export interface RankingBadge {
  sourceName: string;
  listName: string;
  rankPosition: number;
  prestigeTier: string;
}
