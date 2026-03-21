-- Enable pg_trgm extension for fuzzy/trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a generated tsvector column for full-text search across key course fields
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(course_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(facility_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(city, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(state, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(original_architect, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(country, '')), 'D')
) STORED;

-- GIN index for full-text search on the tsvector column
CREATE INDEX IF NOT EXISTS idx_courses_search_vector ON courses USING GIN (search_vector);

-- GIN trigram indexes for fuzzy/partial matching on key text columns
CREATE INDEX IF NOT EXISTS idx_courses_name_trgm ON courses USING GIN (course_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_city_trgm ON courses USING GIN (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_state_trgm ON courses USING GIN (state gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_architect_trgm ON courses USING GIN (original_architect gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_facility_trgm ON courses USING GIN (facility_name gin_trgm_ops);
