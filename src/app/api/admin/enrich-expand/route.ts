import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";
const TARGET_COUNT = 10;
const MAX_COURSES_PER_REQUEST = 20;
const RATE_LIMIT_MS = 1500;
const CONCURRENCY = 4;

type Category = "media" | "dining" | "lodging";

// ── Perplexity helpers ───────────────────────────────────────────────

async function callPerplexity(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const response = await fetch(PERPLEXITY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || null;
}

function parseJsonResponse<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Media enrichment ─────────────────────────────────────────────────

interface MediaItem {
  url: string;
  mediaType: "photo" | "video";
  imageType?: string;
  caption: string;
  credit?: string;
  sourceName?: string;
  sourceUrl?: string;
}

function buildMediaPrompt(course: { courseName: string; city: string | null; state: string | null; country: string }): string {
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  return `Research "${course.courseName}" in ${location} and find real, publicly accessible photo URLs and YouTube video URLs.

Return a JSON object:
{
  "media": [
    {
      "url": "https://example.com/photo.jpg",
      "mediaType": "photo",
      "imageType": "course_overview | hole | clubhouse | aerial | scenery | logo",
      "caption": "Descriptive caption of the image",
      "credit": "Photographer or source name",
      "sourceName": "Website name (e.g. Golf Digest, official site)",
      "sourceUrl": "https://page-where-image-was-found"
    },
    {
      "url": "https://www.youtube.com/watch?v=XXXXX",
      "mediaType": "video",
      "imageType": "flyover | review | drone | tour | highlights",
      "caption": "Video title or description",
      "credit": "Channel name",
      "sourceName": "YouTube",
      "sourceUrl": "https://www.youtube.com/watch?v=XXXXX"
    }
  ]
}

REQUIREMENTS:
1. Find up to ${TARGET_COUNT} media items — aim for ~7 photos and ~3 videos.
2. For photos: find real image URLs (.jpg, .png, .webp) from official course websites, Golf Digest, Golfweek, golf blogs, Google Business listings, and course review sites. URLs must point directly to image files.
3. For videos: find real YouTube video URLs — course flyovers, reviews, drone footage, virtual tours. Use full youtube.com/watch?v= URLs.
4. Prioritize: official course photos first, then professional golf media, then user content.
5. Include a variety: course overview/aerial, individual holes, clubhouse, scenery.
6. Return ONLY valid JSON, no markdown or extra text.`;
}

async function enrichMedia(courseId: number, courseName: string, city: string | null, state: string | null, country: string, existingCount: number): Promise<{ added: number; error?: string }> {
  const needed = TARGET_COUNT - existingCount;
  if (needed <= 0) return { added: 0 };

  const prompt = buildMediaPrompt({ courseName, city, state, country });
  const content = await callPerplexity(
    "You are a golf media researcher. Find real, working photo URLs and YouTube video URLs for golf courses. Return only valid JSON.",
    prompt,
  );

  if (!content) return { added: 0, error: "Empty API response" };

  const parsed = parseJsonResponse<{ media: MediaItem[] }>(content);
  if (!parsed?.media || !Array.isArray(parsed.media)) return { added: 0, error: "Failed to parse response" };

  const validMedia = parsed.media
    .filter((m) => m.url && m.mediaType && (m.mediaType === "photo" || m.mediaType === "video"))
    .slice(0, needed);

  if (validMedia.length === 0) return { added: 0 };

  const existingUrls = await prisma.courseMedia.findMany({
    where: { courseId },
    select: { url: true },
  });
  const urlSet = new Set(existingUrls.map((m) => m.url));
  const newMedia = validMedia.filter((m) => !urlSet.has(m.url));

  if (newMedia.length === 0) return { added: 0 };

  const hasPrimary = await prisma.courseMedia.findFirst({
    where: { courseId, isPrimary: true },
  });

  const startSortOrder = existingCount;
  await prisma.courseMedia.createMany({
    data: newMedia.map((m, i) => ({
      courseId,
      mediaType: m.mediaType,
      imageType: m.imageType || null,
      url: m.url,
      caption: m.caption || null,
      credit: m.credit || null,
      sourceName: m.sourceName || null,
      sourceUrl: m.sourceUrl || null,
      isPrimary: !hasPrimary && i === 0 && m.mediaType === "photo",
      isActive: true,
      sortOrder: startSortOrder + i,
    })),
  });

  return { added: newMedia.length };
}

// ── Dining enrichment ────────────────────────────────────────────────

interface DiningItem {
  name: string;
  cuisineType: string;
  priceLevel: string;
  rating: number;
  distanceMiles: number;
  description: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  isOnSite: boolean;
}

function buildDiningPrompt(course: { courseName: string; city: string | null; state: string | null; country: string }): string {
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  return `Research the best restaurants near "${course.courseName}" in ${location}.

Return a JSON object:
{
  "dining": [
    {
      "name": "Restaurant Name",
      "cuisineType": "American | Seafood | Italian | Steakhouse | BBQ | Mexican | Asian | etc.",
      "priceLevel": "$ | $$ | $$$ | $$$$",
      "rating": 4.5,
      "distanceMiles": 0,
      "description": "Brief description of the restaurant and what makes it notable",
      "address": "123 Main St, City, ST",
      "phone": "(555) 123-4567",
      "websiteUrl": "https://example.com",
      "isOnSite": true
    }
  ]
}

REQUIREMENTS:
1. Find up to ${TARGET_COUNT} restaurants, sorted by HIGHEST RATED first.
2. If the golf course has on-site/on-property restaurants (at the clubhouse, resort, or facility), list them FIRST and mark them as isOnSite=true with distanceMiles=0.
3. All off-site restaurants should have isOnSite=false with accurate distances.
4. Include a mix of cuisine types.
5. Pick the highest rated, most well-known restaurants in the area.
6. Ratings should be on a 1-5 scale (use half-point increments like 4.5).
7. Return ONLY valid JSON, no markdown or extra text.`;
}

async function enrichDining(courseId: number, courseName: string, city: string | null, state: string | null, country: string, existingCount: number): Promise<{ added: number; error?: string }> {
  const needed = TARGET_COUNT - existingCount;
  if (needed <= 0) return { added: 0 };

  const prompt = buildDiningPrompt({ courseName, city, state, country });
  const content = await callPerplexity(
    "You are a golf travel dining expert. Find the best restaurants near golf courses. Return only valid JSON.",
    prompt,
  );

  if (!content) return { added: 0, error: "Empty API response" };

  const parsed = parseJsonResponse<{ dining: DiningItem[] }>(content);
  if (!parsed?.dining || !Array.isArray(parsed.dining)) return { added: 0, error: "Failed to parse response" };

  const sorted = [...parsed.dining].sort((a, b) => {
    if (a.isOnSite && !b.isOnSite) return -1;
    if (!a.isOnSite && b.isOnSite) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  const items = sorted.filter((d) => d.name).slice(0, needed);
  if (items.length === 0) return { added: 0 };

  const existing = await prisma.courseNearbyDining.findMany({
    where: { courseId },
    select: { name: true },
  });
  const nameSet = new Set(existing.map((d) => d.name.toLowerCase()));
  const newItems = items.filter((d) => !nameSet.has(d.name.toLowerCase()));

  if (newItems.length === 0) return { added: 0 };

  const startSortOrder = existingCount;
  await prisma.courseNearbyDining.createMany({
    data: newItems.map((d, i) => ({
      courseId,
      name: d.name,
      cuisineType: d.cuisineType || null,
      priceLevel: d.priceLevel || null,
      rating: d.rating || null,
      distanceMiles: d.distanceMiles ?? null,
      description: d.description || null,
      address: d.address || null,
      phone: d.phone || null,
      websiteUrl: d.websiteUrl || null,
      isOnSite: d.isOnSite || false,
      sortOrder: startSortOrder + i,
    })),
  });

  return { added: newItems.length };
}

// ── Lodging enrichment ───────────────────────────────────────────────

interface LodgingItem {
  name: string;
  lodgingType: string;
  priceTier: string;
  avgPricePerNight?: number;
  rating: number;
  distanceMiles: number;
  description: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  isOnSite: boolean;
}

function buildLodgingPrompt(course: { courseName: string; city: string | null; state: string | null; country: string }): string {
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  return `Research the best lodging options near "${course.courseName}" in ${location}.

Return a JSON object:
{
  "lodging": [
    {
      "name": "Hotel/Resort Name",
      "lodgingType": "Hotel | Resort | B&B | Vacation Rental | RV Park | Campground",
      "priceTier": "$ | $$ | $$$ | $$$$",
      "avgPricePerNight": 150,
      "rating": 4.5,
      "distanceMiles": 0,
      "description": "Brief description of the property",
      "address": "123 Main St, City, ST",
      "phone": "(555) 123-4567",
      "websiteUrl": "https://example.com",
      "bookingUrl": "https://booking.com/hotel/...",
      "isOnSite": true
    }
  ]
}

REQUIREMENTS:
1. Find up to ${TARGET_COUNT} lodging options, sorted by HIGHEST RATED first.
2. If the golf course has on-site/on-property lodging (resort rooms, cottages, cabins on the property), list them FIRST and mark them as isOnSite=true with distanceMiles=0.
3. All off-site lodging should have isOnSite=false with accurate distances.
4. Include a variety: hotels, resorts, B&Bs, vacation rentals. Include at least 1 RV Park or Campground where geographically appropriate.
5. Pick the highest rated lodging options available.
6. Ratings should be on a 1-5 scale (use half-point increments like 4.5).
7. avgPricePerNight should be an integer estimate in USD.
8. Return ONLY valid JSON, no markdown or extra text.`;
}

async function enrichLodging(courseId: number, courseName: string, city: string | null, state: string | null, country: string, existingCount: number): Promise<{ added: number; error?: string }> {
  const needed = TARGET_COUNT - existingCount;
  if (needed <= 0) return { added: 0 };

  const prompt = buildLodgingPrompt({ courseName, city, state, country });
  const content = await callPerplexity(
    "You are a golf travel lodging expert. Find the best hotels and lodging near golf courses. Return only valid JSON.",
    prompt,
  );

  if (!content) return { added: 0, error: "Empty API response" };

  const parsed = parseJsonResponse<{ lodging: LodgingItem[] }>(content);
  if (!parsed?.lodging || !Array.isArray(parsed.lodging)) return { added: 0, error: "Failed to parse response" };

  const sorted = [...parsed.lodging].sort((a, b) => {
    if (a.isOnSite && !b.isOnSite) return -1;
    if (!a.isOnSite && b.isOnSite) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  const items = sorted.filter((l) => l.name).slice(0, needed);
  if (items.length === 0) return { added: 0 };

  const existing = await prisma.courseNearbyLodging.findMany({
    where: { courseId },
    select: { name: true },
  });
  const nameSet = new Set(existing.map((l) => l.name.toLowerCase()));
  const newItems = items.filter((l) => !nameSet.has(l.name.toLowerCase()));

  if (newItems.length === 0) return { added: 0 };

  const startSortOrder = existingCount;
  await prisma.courseNearbyLodging.createMany({
    data: newItems.map((l, i) => ({
      courseId,
      name: l.name,
      lodgingType: l.lodgingType || "Hotel",
      priceTier: l.priceTier || null,
      avgPricePerNight: l.avgPricePerNight || null,
      rating: l.rating || null,
      distanceMiles: l.distanceMiles ?? null,
      description: l.description || null,
      address: l.address || null,
      phone: l.phone || null,
      websiteUrl: l.websiteUrl || null,
      bookingUrl: l.bookingUrl || null,
      isOnSite: l.isOnSite || false,
      sortOrder: startSortOrder + i,
    })),
  });

  return { added: newItems.length };
}

// ── Enrich all categories for a single course ────────────────────────

interface CourseRow {
  course_id: number;
  course_name: string;
  city: string | null;
  state: string | null;
  country: string;
  media_count: number;
  dining_count: number;
  lodging_count: number;
}

async function enrichAllCategories(
  course: CourseRow,
  validCategories: Category[],
): Promise<{
  courseId: number;
  courseName: string;
  media?: { existing: number; added: number; error?: string };
  dining?: { existing: number; added: number; error?: string };
  lodging?: { existing: number; added: number; error?: string };
}> {
  const result: {
    courseId: number;
    courseName: string;
    media?: { existing: number; added: number; error?: string };
    dining?: { existing: number; added: number; error?: string };
    lodging?: { existing: number; added: number; error?: string };
  } = {
    courseId: course.course_id,
    courseName: course.course_name,
  };

  try {
    if (validCategories.includes("media") && course.media_count < TARGET_COUNT) {
      const mediaResult = await enrichMedia(
        course.course_id,
        course.course_name,
        course.city,
        course.state,
        course.country,
        course.media_count,
      );
      result.media = { existing: course.media_count, ...mediaResult };
      if (validCategories.length > 1) await delay(RATE_LIMIT_MS);
    }

    if (validCategories.includes("dining") && course.dining_count < TARGET_COUNT) {
      const diningResult = await enrichDining(
        course.course_id,
        course.course_name,
        course.city,
        course.state,
        course.country,
        course.dining_count,
      );
      result.dining = { existing: course.dining_count, ...diningResult };
      if (validCategories.includes("lodging")) await delay(RATE_LIMIT_MS);
    }

    if (validCategories.includes("lodging") && course.lodging_count < TARGET_COUNT) {
      const lodgingResult = await enrichLodging(
        course.course_id,
        course.course_name,
        course.city,
        course.state,
        course.country,
        course.lodging_count,
      );
      result.lodging = { existing: course.lodging_count, ...lodgingResult };
    }
  } catch (err: any) {
    const errMsg = err.message || "Unknown error";
    if (!result.media && validCategories.includes("media")) {
      result.media = { existing: course.media_count, added: 0, error: errMsg };
    }
    if (!result.dining && validCategories.includes("dining")) {
      result.dining = { existing: course.dining_count, added: 0, error: errMsg };
    }
    if (!result.lodging && validCategories.includes("lodging")) {
      result.lodging = { existing: course.lodging_count, added: 0, error: errMsg };
    }
  }

  return result;
}

// ── Main endpoint ────────────────────────────────────────────────────

/**
 * POST /api/admin/enrich-expand
 * Unified enrichment endpoint — expand media, dining, and lodging to 10 per course.
 * Uses raw SQL to find least-enriched courses first, with cursor-based pagination.
 * Body: { courseIds?: number[], limit?: number, categories?: ('media' | 'dining' | 'lodging')[], afterCourseId?: number }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: "PERPLEXITY_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const {
    courseIds,
    limit = 10,
    categories = ["media", "dining", "lodging"] as Category[],
    afterCourseId,
  } = body;

  const validCategories: Category[] = categories.filter((c: string) =>
    ["media", "dining", "lodging"].includes(c),
  );
  if (validCategories.length === 0) {
    return NextResponse.json({ error: "No valid categories specified" }, { status: 400 });
  }

  const targetLimit = Math.min(limit, MAX_COURSES_PER_REQUEST);

  let courses: CourseRow[];

  if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
    if (courseIds.length > MAX_COURSES_PER_REQUEST) {
      return NextResponse.json({ error: `Max ${MAX_COURSES_PER_REQUEST} courseIds per request` }, { status: 400 });
    }
    // Specific course IDs requested — use targeted query
    const ids = courseIds.map(Number);
    courses = await prisma.$queryRaw<CourseRow[]>`
      SELECT c.course_id, c.course_name, c.city, c.state, c.country,
             COALESCE(mc.cnt, 0)::int as media_count,
             COALESCE(dc.cnt, 0)::int as dining_count,
             COALESCE(lc.cnt, 0)::int as lodging_count
      FROM courses c
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_media GROUP BY course_id) mc ON mc.course_id = c.course_id
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_dining GROUP BY course_id) dc ON dc.course_id = c.course_id
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_lodging GROUP BY course_id) lc ON lc.course_id = c.course_id
      WHERE c.course_id = ANY(${ids})
        AND c.description IS NOT NULL
        AND (COALESCE(mc.cnt, 0) < ${TARGET_COUNT} OR COALESCE(dc.cnt, 0) < ${TARGET_COUNT} OR COALESCE(lc.cnt, 0) < ${TARGET_COUNT})
      ORDER BY (COALESCE(mc.cnt, 0) + COALESCE(dc.cnt, 0) + COALESCE(lc.cnt, 0)) ASC,
               c.num_lists_appeared DESC
    `;
  } else {
    // Least-enriched-first with cursor pagination
    const cursorId = afterCourseId ? Number(afterCourseId) : 0;
    courses = await prisma.$queryRaw<CourseRow[]>`
      SELECT c.course_id, c.course_name, c.city, c.state, c.country,
             COALESCE(mc.cnt, 0)::int as media_count,
             COALESCE(dc.cnt, 0)::int as dining_count,
             COALESCE(lc.cnt, 0)::int as lodging_count
      FROM courses c
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_media GROUP BY course_id) mc ON mc.course_id = c.course_id
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_dining GROUP BY course_id) dc ON dc.course_id = c.course_id
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_lodging GROUP BY course_id) lc ON lc.course_id = c.course_id
      WHERE c.description IS NOT NULL
        AND (COALESCE(mc.cnt, 0) < ${TARGET_COUNT} OR COALESCE(dc.cnt, 0) < ${TARGET_COUNT} OR COALESCE(lc.cnt, 0) < ${TARGET_COUNT})
        AND c.course_id > ${cursorId}
      ORDER BY (COALESCE(mc.cnt, 0) + COALESCE(dc.cnt, 0) + COALESCE(lc.cnt, 0)) ASC,
               c.num_lists_appeared DESC,
               c.course_id ASC
      LIMIT ${targetLimit}
    `;
  }

  if (courses.length === 0) {
    return NextResponse.json({
      success: true,
      totalCourses: 0,
      categories: validCategories,
      summary: { mediaAdded: 0, diningAdded: 0, lodgingAdded: 0, coursesWithErrors: 0 },
      nextCursor: null,
      results: [],
    });
  }

  // Process courses in parallel chunks of CONCURRENCY
  const allResults: Awaited<ReturnType<typeof enrichAllCategories>>[] = [];
  const chunks = chunkArray(courses, CONCURRENCY);

  for (const chunk of chunks) {
    const settled = await Promise.allSettled(
      chunk.map((course) => enrichAllCategories(course, validCategories)),
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        allResults.push(outcome.value);
      } else {
        // Should not happen since enrichAllCategories catches internally, but handle gracefully
        allResults.push({
          courseId: 0,
          courseName: "Unknown",
          media: { existing: 0, added: 0, error: outcome.reason?.message || "Unknown error" },
        });
      }
    }

    // Rate limit between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await delay(RATE_LIMIT_MS);
    }
  }

  // Summary stats
  const totalMediaAdded = allResults.reduce((sum, r) => sum + (r.media?.added || 0), 0);
  const totalDiningAdded = allResults.reduce((sum, r) => sum + (r.dining?.added || 0), 0);
  const totalLodgingAdded = allResults.reduce((sum, r) => sum + (r.lodging?.added || 0), 0);
  const errCount = allResults.filter(
    (r) => r.media?.error || r.dining?.error || r.lodging?.error,
  ).length;

  // Cursor: last courseId processed for pagination
  const lastCourseId = courses[courses.length - 1].course_id;

  return NextResponse.json({
    success: true,
    totalCourses: courses.length,
    categories: validCategories,
    summary: {
      mediaAdded: totalMediaAdded,
      diningAdded: totalDiningAdded,
      lodgingAdded: totalLodgingAdded,
      coursesWithErrors: errCount,
    },
    nextCursor: courses.length === targetLimit ? lastCourseId : null,
    results: allResults,
  });
}
