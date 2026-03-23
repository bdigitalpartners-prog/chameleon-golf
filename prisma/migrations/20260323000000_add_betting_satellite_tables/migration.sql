-- Betting & DFS Course Intelligence
CREATE TABLE IF NOT EXISTS "course_betting_data" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL,
  "tournament_id" INTEGER,
  "stat_type" TEXT NOT NULL,
  "stat_value" DOUBLE PRECISION NOT NULL,
  "tour" TEXT,
  "year" INTEGER,
  "rounds_played" INTEGER,
  "source" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "course_dfs_profile" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL UNIQUE,
  "course_type" TEXT,
  "key_stat" TEXT,
  "historical_cut_line" TEXT,
  "typical_winning_score" TEXT,
  "course_correlation" TEXT,
  "notes" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Satellite Course Feature Analysis
CREATE TABLE IF NOT EXISTS "course_satellite_features" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL UNIQUE,
  "total_acreage" DOUBLE PRECISION,
  "water_feature_count" INTEGER,
  "water_coverage_pct" DOUBLE PRECISION,
  "bunker_count" INTEGER,
  "bunker_coverage_pct" DOUBLE PRECISION,
  "tree_coverage_pct" DOUBLE PRECISION,
  "elevation_range_ft" DOUBLE PRECISION,
  "has_island_green" BOOLEAN DEFAULT FALSE,
  "has_coastal_holes" BOOLEAN DEFAULT FALSE,
  "has_desert_terrain" BOOLEAN DEFAULT FALSE,
  "routing_type" TEXT,
  "analysis_date" DATE,
  "confidence_score" DOUBLE PRECISION,
  "satellite_image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_betting_data_course_id" ON "course_betting_data" ("course_id");
CREATE INDEX IF NOT EXISTS "idx_betting_data_stat_type" ON "course_betting_data" ("stat_type");
CREATE INDEX IF NOT EXISTS "idx_betting_data_year" ON "course_betting_data" ("year");
CREATE INDEX IF NOT EXISTS "idx_dfs_profile_course_type" ON "course_dfs_profile" ("course_type");
CREATE INDEX IF NOT EXISTS "idx_satellite_bunker_count" ON "course_satellite_features" ("bunker_count");
CREATE INDEX IF NOT EXISTS "idx_satellite_water_pct" ON "course_satellite_features" ("water_coverage_pct");
CREATE INDEX IF NOT EXISTS "idx_satellite_tree_pct" ON "course_satellite_features" ("tree_coverage_pct");
CREATE INDEX IF NOT EXISTS "idx_satellite_elevation" ON "course_satellite_features" ("elevation_range_ft");
