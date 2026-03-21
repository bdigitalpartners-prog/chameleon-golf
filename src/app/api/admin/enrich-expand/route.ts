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

  // Filter valid items and limit to needed count
  const validMedia = parsed.media
    .filter((m) => m.url && m.mediaType && (m.mediaType === "photo" || m.mediaType === "video"))
    .slice(0, needed);

  if (validMedia.length === 0) return { added: 0 };

  // Check for existing URLs to avoid duplicates
  const existingUrls = await prisma.courseMedia.findMany({
    where: { courseId },
    select: { url: true },
  });
  const urlSet = new Set(existingUrls.map((m) => m.url));
  const newMedia = validMedia.filter((m) => !urlSet.has(m.url));

  if (newMedia.length === 0) return { added: 0 };

  // Determine if we need to set isPrimary (no existing primary photo)
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

  // Sort: on-site first, then by rating descending
  const sorted = [...parsed.dining].sort((a, b) => {
    if (a.isOnSite && !b.isOnSite) return -1;
    if (!a.isOnSite && b.isOnSite) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  const items = sorted.filter((d) => d.name).slice(0, needed);
  if (items.length === 0) return { added: 0 };

  // Check for duplicates by name
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

  // Sort: on-site first, then by rating descending
  const sorted = [...parsed.lodging].sort((a, b) => {
    if (a.isOnSite && !b.isOnSite) return -1;
    if (!a.isOnSite && b.isOnSite) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  const items = sorted.filter((l) => l.name).slice(0, needed);
  if (items.length === 0) return { added: 0 };

  // Check for duplicates by name
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

// ── Main endpoint ────────────────────────────────────────────────────

/**
 * POST /api/admin/enrich-expand
 * Unified enrichment endpoint — expand media, dining, and lodging to 10 per course.
 * Body: { courseIds?: number[], limit?: number, categories?: ('media' | 'dining' | 'lodging')[] }
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
  } = body;

  // Validate
  const validCategories: Category[] = categories.filter((c: string) =>
    ["media", "dining", "lodging"].includes(c),
  );
  if (validCategories.length === 0) {
    return NextResponse.json({ error: "No valid categories specified" }, { status: 400 });
  }

  const where: any = {
    // Only consider courses that have base enrichment (description populated)
    description: { not: null },
  };
  if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
    if (courseIds.length > MAX_COURSES_PER_REQUEST) {
      return NextResponse.json({ error: `Max ${MAX_COURSES_PER_REQUEST} courseIds per request` }, { status: 400 });
    }
    where.courseId = { in: courseIds.map(Number) };
  }

  const targetLimit = Math.min(limit, MAX_COURSES_PER_REQUEST);

  // Overfetch to compensate for courses we'll filter out (already full in all categories)
  const fetched = await prisma.course.findMany({
    where,
    select: {
      courseId: true,
      courseName: true,
      city: true,
      state: true,
      country: true,
      _count: {
        select: {
          media: true,
          nearbyDining: true,
          nearbyLodging: true,
        },
      },
    },
    orderBy: [{ numListsAppeared: "desc" }, { courseId: "asc" }],
    take: targetLimit * 3,
  });

  // Filter out courses where ALL requested categories already have >= TARGET_COUNT items
  const courses = fetched
    .filter((course) => {
      const counts: Record<Category, number> = {
        media: course._count.media,
        dining: course._count.nearbyDining,
        lodging: course._count.nearbyLodging,
      };
      // Keep the course if ANY requested category still needs items
      return validCategories.some((cat) => counts[cat] < TARGET_COUNT);
    })
    .slice(0, targetLimit);

  const results: Array<{
    courseId: number;
    courseName: string;
    media?: { existing: number; added: number; error?: string };
    dining?: { existing: number; added: number; error?: string };
    lodging?: { existing: number; added: number; error?: string };
  }> = [];

  for (const course of courses) {
    const result: (typeof results)[number] = {
      courseId: course.courseId,
      courseName: course.courseName,
    };

    try {
      if (validCategories.includes("media")) {
        const mediaResult = await enrichMedia(
          course.courseId,
          course.courseName,
          course.city,
          course.state,
          course.country,
          course._count.media,
        );
        result.media = { existing: course._count.media, ...mediaResult };
        if (validCategories.length > 1) await delay(RATE_LIMIT_MS);
      }

      if (validCategories.includes("dining")) {
        const diningResult = await enrichDining(
          course.courseId,
          course.courseName,
          course.city,
          course.state,
          course.country,
          course._count.nearbyDining,
        );
        result.dining = { existing: course._count.nearbyDining, ...diningResult };
        if (validCategories.includes("lodging")) await delay(RATE_LIMIT_MS);
      }

      if (validCategories.includes("lodging")) {
        const lodgingResult = await enrichLodging(
          course.courseId,
          course.courseName,
          course.city,
          course.state,
          course.country,
          course._count.nearbyLodging,
        );
        result.lodging = { existing: course._count.nearbyLodging, ...lodgingResult };
      }
    } catch (err: any) {
      // Attach error to whichever category was in progress
      const errMsg = err.message || "Unknown error";
      if (!result.media && validCategories.includes("media")) {
        result.media = { existing: course._count.media, added: 0, error: errMsg };
      }
      if (!result.dining && validCategories.includes("dining")) {
        result.dining = { existing: course._count.nearbyDining, added: 0, error: errMsg };
      }
      if (!result.lodging && validCategories.includes("lodging")) {
        result.lodging = { existing: course._count.nearbyLodging, added: 0, error: errMsg };
      }
    }

    // Rate limit between courses
    if (courses.indexOf(course) < courses.length - 1) {
      await delay(RATE_LIMIT_MS);
    }

    results.push(result);
  }

  // Summary stats
  const totalMediaAdded = results.reduce((sum, r) => sum + (r.media?.added || 0), 0);
  const totalDiningAdded = results.reduce((sum, r) => sum + (r.dining?.added || 0), 0);
  const totalLodgingAdded = results.reduce((sum, r) => sum + (r.lodging?.added || 0), 0);
  const errCount = results.filter(
    (r) => r.media?.error || r.dining?.error || r.lodging?.error,
  ).length;

  return NextResponse.json({
    success: true,
    totalCourses: courses.length,
    skippedAlreadyFull: fetched.length - courses.length,
    categories: validCategories,
    summary: {
      mediaAdded: totalMediaAdded,
      diningAdded: totalDiningAdded,
      lodgingAdded: totalLodgingAdded,
      coursesWithErrors: errCount,
    },
    results,
  });
}
