/**
 * Feature Flags Configuration
 * ============================
 * Controls which enhancement features are enabled.
 * Set via environment variables in .env / .env.local.
 */

export const FEATURES = {
  /** Enhancement 1: GHIN API Integration */
  GHIN_INTEGRATION: process.env.FEATURE_GHIN_INTEGRATION === "true",

  /** Enhancement 2: AI Concierge Deepening with EQ context */
  AI_CONCIERGE_DEEP: process.env.FEATURE_AI_CONCIERGE_DEEP === "true",

  /** Enhancement 3: EQ Trip Planner */
  TRIP_PLANNER: process.env.FEATURE_TRIP_PLANNER === "true",

  /** Enhancement 4: EQ Events Discovery */
  EVENTS_DISCOVERY: process.env.FEATURE_EVENTS_DISCOVERY === "true",

  /** Enhancement 5: Gamification & Challenges */
  GAMIFICATION: process.env.FEATURE_GAMIFICATION === "true",

  /** Enhancement 6: EQ Leagues */
  EQ_LEAGUES: process.env.FEATURE_EQ_LEAGUES === "true",

  /** Enhancement 7: EQ Academy & Course Prep Packs */
  EQ_ACADEMY: process.env.FEATURE_EQ_ACADEMY === "true",

  /** Enhancement 8: Live Scoring / GHIN Round Data */
  ROUND_HISTORY: process.env.FEATURE_ROUND_HISTORY === "true",
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
