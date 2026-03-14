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
  weightedScore?: number | null;
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
  sortBy?: "chameleon" | "name" | "rank" | "fee" | "weighted";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
  // New filters
  listId?: number;
  walkingPolicy?: string;
  yearMin?: number;
  yearMax?: number;
  architect?: string;
  // Weight params
  w_expert?: number;
  w_conditioning?: number;
  w_layout?: number;
  w_aesthetics?: number;
  w_challenge?: number;
  w_value?: number;
  w_walkability?: number;
  w_pace?: number;
  w_amenities?: number;
  w_service?: number;
}

export interface FilterWeights {
  rankingWeight: number;
  conditionWeight: number;
  designWeight: number;
  valueWeight: number;
  ambienceWeight: number;
  difficultyWeight: number;
}

export interface WeightSliderValues {
  w_expert: number;
  w_conditioning: number;
  w_layout: number;
  w_aesthetics: number;
  w_challenge: number;
  w_value: number;
  w_walkability: number;
  w_pace: number;
  w_amenities: number;
  w_service: number;
}

export interface RankingBadge {
  sourceName: string;
  listName: string;
  rankPosition: number;
  prestigeTier: string;
}
