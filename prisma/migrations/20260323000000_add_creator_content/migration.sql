-- CreateTable: creator_content
CREATE TABLE IF NOT EXISTS creator_content (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_handle TEXT,
  content_url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP,
  view_count INTEGER,
  content_type TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  auto_tagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_creator_content_course_id ON creator_content(course_id);
CREATE INDEX IF NOT EXISTS idx_creator_content_platform ON creator_content(platform);
CREATE INDEX IF NOT EXISTS idx_creator_content_creator_handle ON creator_content(creator_handle);
CREATE INDEX IF NOT EXISTS idx_creator_content_creator_name ON creator_content(creator_name);
CREATE INDEX IF NOT EXISTS idx_creator_content_published_at ON creator_content(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_content_content_type ON creator_content(content_type);
