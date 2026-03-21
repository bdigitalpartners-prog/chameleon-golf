import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";
const TARGET_COUNT = 10;

type Category = "media" | "dining" | "lodging";

// ─── Perplexity helpers ───────────────────────────────────────────────────────

async function askPerplexity(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(PERPLEXITY_ENDPOINT, {
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
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Perplexity API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty Perplexity response");
  return content;
}

function parseJSON(raw: string): any {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in response");
  return JSON.parse(match[0]);
}

// ─── Media enrichment ─────────────────────────────────────────────────────────

interface MediaItem {
  url: string;
  mediaType: "photo" | "video";
  caption?: string;
  credit?: string;
  sourceName?: string;
  sourceUrl?: string;
}

function buildMediaPrompt(courseName: string, location: string, needed: number): string {
  return `Research "${courseName}" in ${location} and find real, publicly accessible media.

Find ${needed} media items for this golf course. Include a mix of photos and videos:

For PHOTOS: Find real image URLs from official course websites, Golf Digest, Golfweek, golf blogs, course review sites, and tourism sites. Look for high-quality course photography — aerial views, signature holes, clubhouse, scenery.

For VIDEOS: Find real YouTube video URLs — course flyovers, drone footage, course reviews, tour/walkthrough videos, tournament coverage.

Return a JSON object:
{
  "media": [
    {
      "url": "https://real-url-to-image-or-video",
      "mediaType": "photo" or "video",
      "caption": "Brief description of what the image/video shows",
      "credit": "Photographer or creator name if known",
      "sourceName": "Website or channel name (e.g. Golf Digest, YouTube)",
      "sourceUrl": "URL of the page where this was found"
    }
  ]
}

IMPORTANT:
- Only include REAL, working URLs — do not fabricate URLs
- For YouTube videos, use the standard watch URL format: https://www.youtube.com/watch?v=...
- For photos, use direct image URLs where possible
- Prioritize the highest quality, most representative images first
- Include at least 1-2 videos if available
- Return ONLY valid JSON, no markdown or extra text`;
}

async function enrichMedia(
  courseId: number,
  courseName: string,
  location: string,
  existingCount: number
): Promise<{ added: number; error?: string }> {
  const needed = TARGET_COUNT - existingCount;
  if (needed <= 0) return { added: 0 };

  try {
    const raw = await askPerplexity(
      "You are a golf media research assistant. Find real photo URLs and YouTube video URLs for golf courses. Return only valid JSON.",
      buildMediaPrompt(courseName, location, needed)
    );

    const parsed = parseJSON(raw);
    const items: MediaItem[] = Array.isArray(parsed.media) ? parsed.media : [];

    if (items.length === 0) return { added: 0 };

    // Check if there's already a primary photo
    const hasPrimary = existingCount > 0
      ? (await prisma.courseMedia.count({
          where: { courseId, isPrimary: true },
        })) > 0
      : false;

    const toInsert = items.slice(0, needed);

    await prisma.courseMedia.createMany({
      data: toInsert.map((item, i) => ({
        courseId,
        mediaType: item.mediaType === "video" ? "video" : "photo",
        imageType: item.mediaType === "video" ? "youtube" : "course",
        url: item.url,
        caption: item.caption?.slice(0, 500) || null,
        credit: item.credit?.slice(0, 200) || null,
        sourceName: item.sourceName?.slice(0, 200) || null,
        sourceUrl: item.sourceUrl?.slice(0, 500) || null,
        isPrimary: !hasPrimary && i === 0 && item.mediaType === "photo",
        isActive: true,
        sortOrder: existingCount + i,
      })),
    });

    return { added: toInsert.length };
  } catch (err: any) {
    return { added: 0, error: err.message };
  }
}

// ─── Dining enrichment ────────────────────────────────────────────────────────

interface DiningItem {
  name: string;
  cuisineType?: string;
  priceLevel?: string;
  rating?: number;
  distanceMiles?: number;
  description?: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  isOnSite?: boolean;
}

function buildDiningPrompt(courseName: string, location: string, needed: number): string {
  return `Research restaurants near "${courseName}" in ${location}.

Find the ${needed} HIGHEST RATED restaurants near this golf course.

If the golf course has on-site/on-property restaurants (at the clubhouse, resort, or facility), list them FIRST and mark them as on-site.

Return a JSON object:
{
  "dining": [
    {
      "name": "Restaurant Name",
      "cuisineType": "American | Seafood | Italian | Steakhouse | Mexican | Asian | BBQ | etc.",
      "priceLevel": "$ | $$ | $$$ | $$$$",
      "rating": 4.5,
      "distanceMiles": 0.0,
      "description": "Brief description of the restaurant and what it's known for",
      "address": "Full street address",
      "phone": "(555) 123-4567",
      "websiteUrl": "https://...",
      "googleMapsUrl": "https://maps.google.com/...",
      "isOnSite": false
    }
  ]
}

IMPORTANT:
- Sort by: on-site restaurants FIRST, then by highest rating descending
- Set isOnSite=true for restaurants ON the golf course property (clubhouse grill, resort restaurant, etc.)
- On-site restaurants should have distanceMiles=0
- Include a mix of cuisine types
- Pick the HIGHEST RATED restaurants available
- Return ONLY valid JSON, no markdown or extra text`;
}

async function enrichDining(
  courseId: number,
  courseName: string,
  location: string,
  existingCount: number
): Promise<{ added: number; error?: string }> {
  const needed = TARGET_COUNT - existingCount;
  if (needed <= 0) return { added: 0 };

  try {
    const raw = await askPerplexity(
      "You are a golf travel dining expert. Find the best restaurants near golf courses. Return only valid JSON.",
      buildDiningPrompt(courseName, location, needed)
    );

    const parsed = parseJSON(raw);
    const items: DiningItem[] = Array.isArray(parsed.dining) ? parsed.dining : [];

    if (items.length === 0) return { added: 0 };

    // Sort: on-site first, then by rating descending
    const sorted = [...items].sort((a, b) => {
      if (a.isOnSite && !b.isOnSite) return -1;
      if (!a.isOnSite && b.isOnSite) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    const toInsert = sorted.slice(0, needed);

    await prisma.courseNearbyDining.createMany({
      data: toInsert.map((d, i) => ({
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
        googleMapsUrl: d.googleMapsUrl || null,
        isOnSite: d.isOnSite || false,
        sortOrder: existingCount + i,
      })),
    });

    return { added: toInsert.length };
  } catch (err: any) {
    return { added: 0, error: err.message };
  }
}

// ─── Lodging enrichment ───────────────────────────────────────────────────────

interface LodgingItem {
  name: string;
  lodgingType?: string;
  priceTier?: string;
  avgPricePerNight?: number;
  rating?: number;
  distanceMiles?: number;
  description?: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  isOnSite?: boolean;
}

function buildLodgingPrompt(courseName: string, location: string, needed: number): string {
  return `Research lodging options near "${courseName}" in ${location}.

Find the ${needed} HIGHEST RATED lodging options near this golf course.

If the golf course has on-site/on-property lodging (resort rooms, cottages, cabins on the property), list them FIRST and mark them as on-site.

Include a variety: hotels, resorts, B&Bs, vacation rentals, and at least 1 RV park or campground.

Return a JSON object:
{
  "lodging": [
    {
      "name": "Hotel/Resort Name",
      "lodgingType": "Hotel | Resort | B&B | Vacation Rental | RV Park | Campground",
      "priceTier": "$ | $$ | $$$ | $$$$",
      "avgPricePerNight": 150,
      "rating": 4.5,
      "distanceMiles": 0.0,
      "description": "Brief description of the property",
      "address": "Full street address",
      "phone": "(555) 123-4567",
      "websiteUrl": "https://...",
      "bookingUrl": "https://...",
      "isOnSite": false
    }
  ]
}

IMPORTANT:
- Sort by: on-site lodging FIRST, then by highest rating descending
- Set isOnSite=true for lodging ON the golf course property (resort hotel, on-site cabins, etc.)
- On-site lodging should have distanceMiles=0
- Pick the HIGHEST RATED lodging options
- Include at least 1 RV Park or Campground where geographically appropriate
- Return ONLY valid JSON, no markdown or extra text`;
}

async function enrichLodging(
  courseId: number,
  courseName: string,
  location: string,
  existingCount: number
): Promise<{ added: number; error?: string }> {
  const needed = TARGET_COUNT - existingCount;
  if (needed <= 0) return { added: 0 };

  try {
    const raw = await askPerplexity(
      "You are a golf travel lodging expert. Find the best lodging near golf courses. Return only valid JSON.",
      buildLodgingPrompt(courseName, location, needed)
    );

    const parsed = parseJSON(raw);
    const items: LodgingItem[] = Array.isArray(parsed.lodging) ? parsed.lodging : [];

    if (items.length === 0) return { added: 0 };

    // Sort: on-site first, then by rating descending
    const sorted = [...items].sort((a, b) => {
      if (a.isOnSite && !b.isOnSite) return -1;
      if (!a.isOnSite && b.isOnSite) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    const toInsert = sorted.slice(0, needed);

    await prisma.courseNearbyLodging.createMany({
      data: toInsert.map((l, i) => ({
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
        sortOrder: existingCount + i,
      })),
    });

    return { added: toInsert.length };
  } catch (err: any) {
    return { added: 0, error: err.message };
  }
}

// ─── Main endpoint ────────────────────────────────────────────────────────────

/**
 * POST /api/admin/enrich-expand
 *
 * Unified enrichment endpoint — expands media, dining, and lodging to 10 per course.
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
    limit = 20,
    categories = ["media", "dining", "lodging"] as Category[],
  } = body;

  // Validate
  const validCategories: Category[] = categories.filter((c: string) =>
    ["media", "dining", "lodging"].includes(c)
  );
  if (validCategories.length === 0) {
    return NextResponse.json({ error: "At least one valid category required" }, { status: 400 });
  }

  const cappedLimit = Math.min(Number(limit) || 20, 20);

  // Build query
  const where: any = {};
  if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
    if (courseIds.length > 100) {
      return NextResponse.json({ error: "Max 100 courseIds per request" }, { status: 400 });
    }
    where.courseId = { in: courseIds.map(Number) };
  }

  const courses = await prisma.course.findMany({
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
    take: cappedLimit,
  });

  const results: Array<{
    courseId: number;
    courseName: string;
    media?: { existing: number; added: number; error?: string };
    dining?: { existing: number; added: number; error?: string };
    lodging?: { existing: number; added: number; error?: string };
  }> = [];

  for (const course of courses) {
    const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
    const result: (typeof results)[number] = {
      courseId: course.courseId,
      courseName: course.courseName,
    };

    if (validCategories.includes("media")) {
      const existing = course._count.media;
      const res = await enrichMedia(course.courseId, course.courseName, location, existing);
      result.media = { existing, ...res };
    }

    if (validCategories.includes("dining")) {
      const existing = course._count.nearbyDining;
      const res = await enrichDining(course.courseId, course.courseName, location, existing);
      result.dining = { existing, ...res };
    }

    if (validCategories.includes("lodging")) {
      const existing = course._count.nearbyLodging;
      const res = await enrichLodging(course.courseId, course.courseName, location, existing);
      result.lodging = { existing, ...res };
    }

    results.push(result);

    // Rate limit between courses (1.5s)
    if (courses.indexOf(course) < courses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // Summarize
  const summary = {
    totalCourses: results.length,
    media: validCategories.includes("media")
      ? {
          totalAdded: results.reduce((s, r) => s + (r.media?.added || 0), 0),
          errors: results.filter((r) => r.media?.error).length,
        }
      : undefined,
    dining: validCategories.includes("dining")
      ? {
          totalAdded: results.reduce((s, r) => s + (r.dining?.added || 0), 0),
          errors: results.filter((r) => r.dining?.error).length,
        }
      : undefined,
    lodging: validCategories.includes("lodging")
      ? {
          totalAdded: results.reduce((s, r) => s + (r.lodging?.added || 0), 0),
          errors: results.filter((r) => r.lodging?.error).length,
        }
      : undefined,
  };

  return NextResponse.json({ success: true, summary, results });
}
