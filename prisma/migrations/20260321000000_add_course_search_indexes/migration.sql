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

-- GIN index on the tsvector column for fast full-text search
CREATE INDEX IF NOT EXISTS idx_courses_search_vector
  ON courses USING GIN (search_vector);

-- GIN trigram indexes for fuzzy matching on key text columns
CREATE INDEX IF NOT EXISTS idx_courses_course_name_trgm
  ON courses USING GIN (course_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_city_trgm
  ON courses USING GIN (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_state_trgm
  ON courses USING GIN (state gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_original_architect_trgm
  ON courses USING GIN (original_architect gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_facility_name_trgm
  ON courses USING GIN (facility_name gin_trgm_ops);

-- Create the search function that combines full-text search with trigram similarity
-- Returns relevance-ranked results using a combined scoring approach
CREATE OR REPLACE FUNCTION search_courses(
  search_query text,
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  course_id int,
  course_name varchar(255),
  facility_name varchar(255),
  city varchar(100),
  state varchar(100),
  country varchar(100),
  original_architect varchar(255),
  num_lists_appeared int,
  logo_url text,
  logo_source varchar(100),
  rank_score float
) AS $$
DECLARE
  tsquery_val tsquery;
  processed_query text;
BEGIN
  -- Normalize the search query
  processed_query := trim(search_query);

  -- Build tsquery: try plainto_tsquery for multi-word, with prefix matching on last word
  -- This allows partial word matching (e.g., "Pine" matches "Pinehurst")
  tsquery_val := (
    SELECT
      CASE
        -- Single word: use prefix matching
        WHEN array_length(string_to_array(processed_query, ' '), 1) = 1 THEN
          to_tsquery('english', processed_query || ':*')
        -- Multi-word: AND all words together with prefix on last word
        ELSE
          to_tsquery('english',
            array_to_string(
              (SELECT array_agg(
                CASE
                  WHEN i = array_length(words, 1) THEN words[i] || ':*'
                  ELSE words[i]
                END
              )
              FROM unnest(string_to_array(processed_query, ' ')) WITH ORDINALITY AS t(word, i),
                   LATERAL (SELECT string_to_array(processed_query, ' ') AS words) w
              ),
              ' & '
            )
          )
      END
  );

  RETURN QUERY
  SELECT
    c.course_id,
    c.course_name,
    c.facility_name,
    c.city,
    c.state,
    c.country,
    c.original_architect,
    c.num_lists_appeared,
    c.logo_url,
    c.logo_source,
    (
      -- Full-text relevance (weighted by field importance via setweight A/B/C/D)
      COALESCE(ts_rank_cd(c.search_vector, tsquery_val), 0) * 10.0 +
      -- Trigram similarity on course name (most important)
      COALESCE(similarity(c.course_name, processed_query), 0) * 5.0 +
      -- Trigram similarity on city
      COALESCE(similarity(c.city, processed_query), 0) * 2.0 +
      -- Trigram similarity on state
      COALESCE(similarity(c.state, processed_query), 0) * 2.0 +
      -- Trigram similarity on architect
      COALESCE(similarity(c.original_architect, processed_query), 0) * 2.0 +
      -- Trigram similarity on facility name
      COALESCE(similarity(c.facility_name, processed_query), 0) * 1.5 +
      -- Boost popular courses slightly
      COALESCE(c.num_lists_appeared, 0)::float * 0.05
    )::float AS rank_score
  FROM courses c
  WHERE
    -- Full-text match
    c.search_vector @@ tsquery_val
    OR
    -- Trigram similarity fallback (catches typos and partial matches)
    similarity(c.course_name, processed_query) > 0.1
    OR similarity(c.city, processed_query) > 0.3
    OR similarity(c.state, processed_query) > 0.3
    OR similarity(c.original_architect, processed_query) > 0.2
    OR similarity(c.facility_name, processed_query) > 0.15
    OR
    -- ILIKE fallback for substring matching (e.g., "Pine" in "Torrey Pines")
    c.course_name ILIKE '%' || processed_query || '%'
    OR c.city ILIKE '%' || processed_query || '%'
    OR c.state ILIKE '%' || processed_query || '%'
    OR c.original_architect ILIKE '%' || processed_query || '%'
    OR c.facility_name ILIKE '%' || processed_query || '%'
  ORDER BY rank_score DESC
  LIMIT result_limit;

EXCEPTION WHEN OTHERS THEN
  -- If tsquery parsing fails (e.g., special characters), fall back to ILIKE + trigram only
  RETURN QUERY
  SELECT
    c.course_id,
    c.course_name,
    c.facility_name,
    c.city,
    c.state,
    c.country,
    c.original_architect,
    c.num_lists_appeared,
    c.logo_url,
    c.logo_source,
    (
      COALESCE(similarity(c.course_name, processed_query), 0) * 5.0 +
      COALESCE(similarity(c.city, processed_query), 0) * 2.0 +
      COALESCE(similarity(c.state, processed_query), 0) * 2.0 +
      COALESCE(similarity(c.original_architect, processed_query), 0) * 2.0 +
      COALESCE(similarity(c.facility_name, processed_query), 0) * 1.5 +
      COALESCE(c.num_lists_appeared, 0)::float * 0.05
    )::float AS rank_score
  FROM courses c
  WHERE
    similarity(c.course_name, processed_query) > 0.1
    OR similarity(c.city, processed_query) > 0.3
    OR similarity(c.state, processed_query) > 0.3
    OR similarity(c.original_architect, processed_query) > 0.2
    OR similarity(c.facility_name, processed_query) > 0.15
    OR c.course_name ILIKE '%' || processed_query || '%'
    OR c.city ILIKE '%' || processed_query || '%'
    OR c.state ILIKE '%' || processed_query || '%'
    OR c.original_architect ILIKE '%' || processed_query || '%'
    OR c.facility_name ILIKE '%' || processed_query || '%'
  ORDER BY rank_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
