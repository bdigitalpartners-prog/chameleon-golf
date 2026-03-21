import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Fuzzy / keyword course search using Postgres full-text search (tsvector) combined
 * with trigram similarity (pg_trgm) for partial-name and typo-tolerant matching.
 *
 * Scoring strategy:
 *   1. ts_rank against the weighted search_vector (course name=A, facility/city/state=B, architect=C, country=D)
 *   2. Best trigram similarity across course_name, city, state, original_architect
 *   3. Bonus for numListsAppeared (popularity tiebreaker)
 *
 * Results are returned ranked by a combined relevance score.
 */
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  // Build a tsquery from the user input: each word gets a prefix match (:*) so
  // partial words like "Pine" match "Pinehurst". Words are ANDed together so
  // "Augusta National" requires both terms.
  const words = q
    .replace(/[^\w\s]/g, " ") // strip punctuation
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return NextResponse.json({ results: [] });

  // For full-text: join with & (AND) using prefix matching
  const tsqueryStr = words.map((w) => `${w}:*`).join(" & ");

  // For trigram: use the raw query string
  const trigramQuery = q;

  type SearchRow = {
    course_id: bigint;
    course_name: string;
    facility_name: string | null;
    city: string | null;
    state: string | null;
    country: string;
    original_architect: string | null;
    relevance: number;
  };

  const results = await prisma.$queryRaw<SearchRow[]>(Prisma.sql`
    SELECT
      c.course_id,
      c.course_name,
      c.facility_name,
      c.city,
      c.state,
      c.country,
      c.original_architect,
      (
        -- Full-text rank (weighted tsvector gives course name highest priority)
        COALESCE(ts_rank(c.search_vector, to_tsquery('english', ${tsqueryStr})), 0) * 10
        -- Trigram similarity across key fields (catches partial/fuzzy matches)
        + GREATEST(
            COALESCE(similarity(c.course_name, ${trigramQuery}), 0),
            COALESCE(similarity(c.facility_name, ${trigramQuery}), 0),
            COALESCE(similarity(c.city, ${trigramQuery}), 0),
            COALESCE(similarity(c.state, ${trigramQuery}), 0),
            COALESCE(similarity(c.original_architect, ${trigramQuery}), 0)
          ) * 5
        -- Popularity tiebreaker
        + COALESCE(c.num_lists_appeared, 0) * 0.01
      ) AS relevance
    FROM courses c
    WHERE
      -- Full-text match
      c.search_vector @@ to_tsquery('english', ${tsqueryStr})
      -- OR trigram similarity above threshold on any key field
      OR similarity(c.course_name, ${trigramQuery}) > 0.1
      OR similarity(c.facility_name, ${trigramQuery}) > 0.1
      OR similarity(c.city, ${trigramQuery}) > 0.15
      OR similarity(c.state, ${trigramQuery}) > 0.15
      OR similarity(c.original_architect, ${trigramQuery}) > 0.15
    ORDER BY relevance DESC
    LIMIT 10
  `);

  const mapped = results.map((r) => ({
    courseId: Number(r.course_id),
    courseName: r.course_name,
    facilityName: r.facility_name,
    city: r.city,
    state: r.state,
    country: r.country,
    originalArchitect: r.original_architect,
  }));

  return NextResponse.json({ results: mapped });
}
