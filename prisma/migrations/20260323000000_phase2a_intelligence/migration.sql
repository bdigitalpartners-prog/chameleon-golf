-- Phase 2A: AI Concierge 2.0, Course-Fit Score, Green Fee Intelligence

-- Concierge conversations
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Concierge messages
CREATE TABLE IF NOT EXISTS concierge_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User golf profile for Course-Fit
CREATE TABLE IF NOT EXISTS user_golf_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  handicap_range TEXT,
  preferred_style TEXT,
  preferred_terrain TEXT,
  walking_preference TEXT,
  budget_range TEXT,
  values_most TEXT,
  travel_radius_miles INTEGER,
  home_latitude REAL,
  home_longitude REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course-Fit scores
CREATE TABLE IF NOT EXISTS course_fit_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  fit_score INTEGER NOT NULL,
  breakdown TEXT,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- Green fee history
CREATE TABLE IF NOT EXISTS green_fee_history (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  fee_type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  season TEXT,
  effective_date DATE,
  source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Green fee value index
CREATE TABLE IF NOT EXISTS green_fee_value_index (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL UNIQUE,
  current_avg_fee REAL,
  value_score INTEGER,
  price_trend TEXT,
  yoy_change_pct REAL,
  percentile_in_state INTEGER,
  percentile_in_tier INTEGER,
  best_value_time TEXT,
  last_calculated TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_concierge_messages_conversation ON concierge_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_concierge_conversations_session ON concierge_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_course_fit_scores_user ON course_fit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_course_fit_scores_course ON course_fit_scores(course_id);
CREATE INDEX IF NOT EXISTS idx_green_fee_history_course ON green_fee_history(course_id);
CREATE INDEX IF NOT EXISTS idx_green_fee_value_index_course ON green_fee_value_index(course_id);
