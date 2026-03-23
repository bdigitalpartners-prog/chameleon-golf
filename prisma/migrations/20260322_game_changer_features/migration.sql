-- Phase 1A: Game Changer Features Migration
-- Creates all new tables for crowdsourced conditions, aeration tracking,
-- walking policy, tournaments, course DNA, concierge, course-fit,
-- green fee intelligence, architect DNA, trip planning, betting/DFS,
-- satellite features, creator content, and EQ Wrapped.

-- ============================================================
-- FEATURE 1: Crowdsourced Course Conditions
-- ============================================================

CREATE TABLE IF NOT EXISTS course_conditions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  user_id TEXT,
  green_speed TEXT,
  green_firmness TEXT,
  fairway_condition TEXT,
  bunker_condition TEXT,
  rough_height TEXT,
  pace_of_play INTEGER,
  wind_conditions TEXT,
  overall_rating INTEGER,
  notes TEXT,
  photo_urls TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  reported_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_conditions_course_id ON course_conditions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_conditions_user_id ON course_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_conditions_reported_at ON course_conditions(reported_at);

CREATE TABLE IF NOT EXISTS condition_votes (
  id SERIAL PRIMARY KEY,
  condition_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(condition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_condition_votes_condition_id ON condition_votes(condition_id);

-- ============================================================
-- FEATURE 2: Aeration & Renovation Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS course_aeration (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  aeration_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  recovery_weeks INTEGER,
  source TEXT,
  reported_by TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_aeration_course_id ON course_aeration(course_id);
CREATE INDEX IF NOT EXISTS idx_course_aeration_dates ON course_aeration(start_date, end_date);

CREATE TABLE IF NOT EXISTS aeration_alerts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id INTEGER,
  alert_radius_miles INTEGER DEFAULT 50,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aeration_alerts_user_id ON aeration_alerts(user_id);

-- ============================================================
-- FEATURE 3: Walking Policy & Accessibility
-- ============================================================

CREATE TABLE IF NOT EXISTS course_walking_policy (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL UNIQUE,
  walking_allowed BOOLEAN,
  walking_restrictions TEXT,
  cart_included BOOLEAN,
  cart_fee DOUBLE PRECISION,
  caddie_available BOOLEAN,
  caddie_fee DOUBLE PRECISION,
  caddie_required BOOLEAN,
  pull_cart_allowed BOOLEAN,
  push_cart_allowed BOOLEAN,
  ada_accessible BOOLEAN,
  ada_details TEXT,
  adaptive_golf_program BOOLEAN,
  terrain_difficulty TEXT,
  estimated_walk_distance_miles DOUBLE PRECISION,
  source TEXT,
  last_verified DATE,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_walking_policy_course_id ON course_walking_policy(course_id);

-- ============================================================
-- FEATURE 4: Tournament History
-- ============================================================

CREATE TABLE IF NOT EXISTS course_tournaments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  tournament_name TEXT NOT NULL,
  tour TEXT,
  year INTEGER NOT NULL,
  winner_name TEXT,
  winner_score TEXT,
  runner_up TEXT,
  winning_purse DOUBLE PRECISION,
  total_purse DOUBLE PRECISION,
  notable_moments TEXT,
  data_source TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, tournament_name, year)
);

CREATE INDEX IF NOT EXISTS idx_course_tournaments_course_id ON course_tournaments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tournaments_year ON course_tournaments(year);

-- ============================================================
-- FEATURE 5: Course DNA Fingerprint
-- ============================================================

CREATE TABLE IF NOT EXISTS course_dna (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL UNIQUE,
  shot_variety INTEGER DEFAULT 0,
  strategic_options INTEGER DEFAULT 0,
  visual_drama INTEGER DEFAULT 0,
  green_complexity INTEGER DEFAULT 0,
  bunker_challenge INTEGER DEFAULT 0,
  water_influence INTEGER DEFAULT 0,
  elevation_change INTEGER DEFAULT 0,
  wind_exposure INTEGER DEFAULT 0,
  recovery_difficulty INTEGER DEFAULT 0,
  length_challenge INTEGER DEFAULT 0,
  walkability_score INTEGER DEFAULT 0,
  conditioning_standard INTEGER DEFAULT 0,
  data_sources TEXT,
  confidence_score DOUBLE PRECISION,
  last_calculated TIMESTAMP(3),
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_dna_course_id ON course_dna(course_id);

-- ============================================================
-- FEATURE 6: AI Concierge 2.0
-- ============================================================

CREATE TABLE IF NOT EXISTS concierge_conversations (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_concierge_conversations_user_id ON concierge_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_conversations_session_id ON concierge_conversations(session_id);

CREATE TABLE IF NOT EXISTS concierge_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_concierge_messages_conversation_id ON concierge_messages(conversation_id);

-- ============================================================
-- FEATURE 7: Course-Fit Score
-- ============================================================

CREATE TABLE IF NOT EXISTS user_golf_profile (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  handicap_range TEXT,
  preferred_style TEXT,
  preferred_terrain TEXT,
  walking_preference TEXT,
  budget_range TEXT,
  values_most TEXT,
  travel_radius_miles INTEGER,
  home_latitude DOUBLE PRECISION,
  home_longitude DOUBLE PRECISION,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_golf_profile_user_id ON user_golf_profile(user_id);

CREATE TABLE IF NOT EXISTS course_fit_scores (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  fit_score INTEGER NOT NULL,
  breakdown TEXT,
  calculated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_fit_scores_user_id ON course_fit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_course_fit_scores_course_id ON course_fit_scores(course_id);

-- ============================================================
-- FEATURE 8: Green Fee Intelligence Index
-- ============================================================

CREATE TABLE IF NOT EXISTS green_fee_history (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  fee_type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'USD',
  season TEXT,
  effective_date DATE,
  source TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_green_fee_history_course_id ON green_fee_history(course_id);

CREATE TABLE IF NOT EXISTS green_fee_value_index (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL UNIQUE,
  current_avg_fee DOUBLE PRECISION,
  value_score INTEGER,
  price_trend TEXT,
  yoy_change_pct DOUBLE PRECISION,
  percentile_in_state INTEGER,
  percentile_in_tier INTEGER,
  best_value_time TEXT,
  last_calculated TIMESTAMP(3),
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_green_fee_value_index_course_id ON green_fee_value_index(course_id);

-- ============================================================
-- FEATURE 9: Architect DNA & Genealogy
-- ============================================================

CREATE TABLE IF NOT EXISTS architect_relationships (
  id SERIAL PRIMARY KEY,
  architect_id INTEGER NOT NULL,
  related_architect_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  description TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(architect_id, related_architect_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_architect_relationships_architect_id ON architect_relationships(architect_id);
CREATE INDEX IF NOT EXISTS idx_architect_relationships_related_id ON architect_relationships(related_architect_id);

CREATE TABLE IF NOT EXISTS architect_design_dna (
  id SERIAL PRIMARY KEY,
  architect_id INTEGER NOT NULL UNIQUE,
  naturalism INTEGER DEFAULT 50,
  strategic_depth INTEGER DEFAULT 50,
  visual_drama INTEGER DEFAULT 50,
  green_complexity INTEGER DEFAULT 50,
  bunker_artistry INTEGER DEFAULT 50,
  routing_genius INTEGER DEFAULT 50,
  minimalism INTEGER DEFAULT 50,
  playability INTEGER DEFAULT 50,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_architect_design_dna_architect_id ON architect_design_dna(architect_id);

-- ============================================================
-- FEATURE 10: Trip Intelligence Engine
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_plans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  num_players INTEGER DEFAULT 1,
  budget_per_person DOUBLE PRECISION,
  home_airport TEXT,
  destination_region TEXT,
  preferences TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);

CREATE TABLE IF NOT EXISTS trip_stops (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL,
  course_id INTEGER,
  day_number INTEGER NOT NULL,
  tee_time TEXT,
  estimated_green_fee DOUBLE PRECISION,
  notes TEXT,
  lodging_name TEXT,
  lodging_type TEXT,
  lodging_cost_per_night DOUBLE PRECISION,
  drive_time_from_previous INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id ON trip_stops(trip_id);

-- ============================================================
-- FEATURE 12: Betting & DFS Intelligence
-- ============================================================

CREATE TABLE IF NOT EXISTS course_betting_data (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  tournament_id INTEGER,
  stat_type TEXT NOT NULL,
  stat_value DOUBLE PRECISION NOT NULL,
  tour TEXT,
  year INTEGER,
  rounds_played INTEGER,
  source TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_betting_data_course_id ON course_betting_data(course_id);

CREATE TABLE IF NOT EXISTS course_dfs_profile (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL UNIQUE,
  course_type TEXT,
  key_stat TEXT,
  historical_cut_line TEXT,
  typical_winning_score TEXT,
  course_correlation TEXT,
  notes TEXT,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_dfs_profile_course_id ON course_dfs_profile(course_id);

-- ============================================================
-- FEATURE 13: Satellite Course Feature Analysis
-- ============================================================

CREATE TABLE IF NOT EXISTS course_satellite_features (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL UNIQUE,
  total_acreage DOUBLE PRECISION,
  water_feature_count INTEGER,
  water_coverage_pct DOUBLE PRECISION,
  bunker_count INTEGER,
  bunker_coverage_pct DOUBLE PRECISION,
  tree_coverage_pct DOUBLE PRECISION,
  elevation_range_ft DOUBLE PRECISION,
  has_island_green BOOLEAN DEFAULT FALSE,
  has_coastal_holes BOOLEAN DEFAULT FALSE,
  has_desert_terrain BOOLEAN DEFAULT FALSE,
  routing_type TEXT,
  analysis_date DATE,
  confidence_score DOUBLE PRECISION,
  satellite_image_url TEXT,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_satellite_features_course_id ON course_satellite_features(course_id);

-- ============================================================
-- FEATURE 14: Creator Content
-- ============================================================

CREATE TABLE IF NOT EXISTS creator_content (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_handle TEXT,
  content_url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP(3),
  view_count INTEGER,
  content_type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  auto_tagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_content_course_id ON creator_content(course_id);

-- ============================================================
-- FEATURE 15: EQ Wrapped
-- ============================================================

CREATE TABLE IF NOT EXISTS eq_wrapped (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  data TEXT NOT NULL,
  generated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  shared_count INTEGER DEFAULT 0,
  UNIQUE(user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_eq_wrapped_user_id ON eq_wrapped(user_id);
