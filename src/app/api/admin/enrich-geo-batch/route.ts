import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";
const TARGET_COUNT = 10;
const MAX_CLUSTERS = 30;
const RATE_LIMIT_MS = 1500;

type Category = "dining" | "lodging";

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
      max_tokens: 8000,
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

// ── Distance calculation ─────────────────────────────────────────────

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

// ── On-property detection ────────────────────────────────────────────

function isOnProperty(
  itemName: string,
  courseName: string,
  facilityName: string | null,
): boolean {
  const itemLower = itemName.toLowerCase();
  const courseWords = courseName.toLowerCase().replace(/golf.*$/i, "").trim();

  // Check if the item name contains meaningful parts of the course name
  if (courseWords.length >= 4 && itemLower.includes(courseWords)) return true;

  // Check facility name
  if (facilityName) {
    const facilityWords = facilityName.toLowerCase().replace(/golf.*$/i, "").trim();
    if (facilityWords.length >= 4 && itemLower.includes(facilityWords)) return true;
  }

  return false;
}

// ── Geo-batch types ──────────────────────────────────────────────────

interface ClusterCourse {
  course_id: number;
  course_name: string;
  facility_name: string | null;
  latitude: number;
  longitude: number;
  dining_count: number;
  lodging_count: number;
}

interface GeoCluster {
  clusterKey: string;
  city: string;
  state: string;
  centerLat: number;
  centerLon: number;
  courses: ClusterCourse[];
}

interface GeoDiningItem {
  name: string;
  cuisineType: string;
  priceLevel: string;
  rating: number;
  latitude: number;
  longitude: number;
  description: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
}

interface GeoLodgingItem {
  name: string;
  lodgingType: string;
  priceTier: string;
  avgPricePerNight?: number;
  rating: number;
  latitude: number;
  longitude: number;
  description: string;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
}

// ── Prompt builders ──────────────────────────────────────────────────

function buildGeoBatchPrompt(
  city: string,
  state: string,
  centerLat: number,
  centerLon: number,
  categories: Category[],
): string {
  const parts: string[] = [];

  if (categories.includes("dining")) {
    parts.push(`"dining": [
    {
      "name": "Restaurant Name",
      "cuisineType": "American | Seafood | Italian | Steakhouse | BBQ | Mexican | Asian | etc.",
      "priceLevel": "$ | $$ | $$$ | $$$$",
      "rating": 4.5,
      "latitude": ${centerLat.toFixed(4)},
      "longitude": ${centerLon.toFixed(4)},
      "description": "Brief description",
      "address": "123 Main St, City, ST",
      "phone": "(555) 123-4567",
      "websiteUrl": "https://example.com"
    }
  ]`);
  }

  if (categories.includes("lodging")) {
    parts.push(`"lodging": [
    {
      "name": "Hotel/Resort Name",
      "lodgingType": "Hotel | Resort | B&B | Vacation Rental | RV Park | Campground",
      "priceTier": "$ | $$ | $$$ | $$$$",
      "avgPricePerNight": 150,
      "rating": 4.5,
      "latitude": ${centerLat.toFixed(4)},
      "longitude": ${centerLon.toFixed(4)},
      "description": "Brief description",
      "address": "123 Main St, City, ST",
      "phone": "(555) 123-4567",
      "websiteUrl": "https://example.com",
      "bookingUrl": "https://booking.com/hotel/..."
    }
  ]`);
  }

  const diningReqs = categories.includes("dining")
    ? `- Find 15 top-rated restaurants in the ${city}, ${state} area near coordinates (${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}).
- Include a mix of cuisine types: steakhouses, seafood, Italian, American, BBQ, etc.
- Include on-site golf course restaurants if you know of any at local courses.
- Sort by rating descending.`
    : "";

  const lodgingReqs = categories.includes("lodging")
    ? `- Find 15 best lodging options in the ${city}, ${state} area near coordinates (${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}).
- Include variety: hotels, resorts, B&Bs, vacation rentals, and at least 1 RV park or campground if appropriate.
- Include on-site golf resort lodging if you know of any at local courses.
- Sort by rating descending.`
    : "";

  return `Research the best ${categories.join(" and ")} options in ${city}, ${state} near coordinates (${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}).

Return a JSON object:
{
  ${parts.join(",\n  ")}
}

REQUIREMENTS:
${diningReqs}
${lodgingReqs}
- Ratings should be on a 1-5 scale (use half-point increments like 4.5).
- Include accurate latitude/longitude for each place so we can calculate distances.
- Return ONLY valid JSON, no markdown or extra text.`;
}

// ── Main endpoint ────────────────────────────────────────────────────

/**
 * POST /api/admin/enrich-geo-batch
 * Geography-based batch enrichment — groups courses by city+state and makes
 * ONE Perplexity call per cluster, then assigns results to ALL courses in that area.
 * Body: { limit?: number, afterCluster?: string, categories?: ('dining' | 'lodging')[] }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: "PERPLEXITY_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const {
    limit = 10,
    afterCluster,
    categories = ["dining", "lodging"] as Category[],
  } = body;

  const validCategories: Category[] = categories.filter((c: string) =>
    ["dining", "lodging"].includes(c),
  );
  if (validCategories.length === 0) {
    return NextResponse.json({ error: "No valid categories. Must be 'dining' and/or 'lodging'." }, { status: 400 });
  }

  const clusterLimit = Math.min(limit, MAX_CLUSTERS);

  // Build category filter conditions
  const categoryConditions: string[] = [];
  if (validCategories.includes("dining")) categoryConditions.push("COALESCE(dc.cnt, 0) < 10");
  if (validCategories.includes("lodging")) categoryConditions.push("COALESCE(lc.cnt, 0) < 10");
  const categoryFilter = categoryConditions.join(" OR ");

  // Find courses grouped by city+state that need enrichment
  // afterCluster is a "city|state" string for cursor pagination
  const afterClusterFilter = afterCluster
    ? `AND CONCAT(c.city, '|', c.state) > '${afterCluster.replace(/'/g, "''")}'`
    : "";

  const clusterRows = await prisma.$queryRawUnsafe<Array<{
    city: string;
    state: string;
    cluster_key: string;
    course_count: number;
  }>>(
    `SELECT c.city, c.state,
            CONCAT(c.city, '|', c.state) as cluster_key,
            COUNT(*) as course_count
     FROM courses c
     LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_dining GROUP BY course_id) dc ON dc.course_id = c.course_id
     LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_lodging GROUP BY course_id) lc ON lc.course_id = c.course_id
     WHERE c.description IS NOT NULL
       AND c.city IS NOT NULL
       AND c.state IS NOT NULL
       AND c.latitude IS NOT NULL
       AND c.longitude IS NOT NULL
       AND (${categoryFilter})
       ${afterClusterFilter}
     GROUP BY c.city, c.state
     ORDER BY CONCAT(c.city, '|', c.state) ASC
     LIMIT ${clusterLimit}`,
  );

  if (clusterRows.length === 0) {
    return NextResponse.json({
      success: true,
      clustersProcessed: 0,
      totalCoursesEnriched: 0,
      nextCluster: null,
      results: [],
    });
  }

  // For each cluster, fetch the actual courses
  const clusters: GeoCluster[] = [];
  for (const row of clusterRows) {
    const courseRows = await prisma.$queryRaw<ClusterCourse[]>`
      SELECT c.course_id, c.course_name, c.facility_name,
             c.latitude::float as latitude, c.longitude::float as longitude,
             COALESCE(dc.cnt, 0)::int as dining_count,
             COALESCE(lc.cnt, 0)::int as lodging_count
      FROM courses c
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_dining GROUP BY course_id) dc ON dc.course_id = c.course_id
      LEFT JOIN (SELECT course_id, COUNT(*) as cnt FROM course_nearby_lodging GROUP BY course_id) lc ON lc.course_id = c.course_id
      WHERE c.city = ${row.city}
        AND c.state = ${row.state}
        AND c.description IS NOT NULL
        AND c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
      ORDER BY c.num_lists_appeared DESC
    `;

    // Filter to courses that actually need enrichment in requested categories
    const needsEnrichment = courseRows.filter((c) => {
      if (validCategories.includes("dining") && c.dining_count < TARGET_COUNT) return true;
      if (validCategories.includes("lodging") && c.lodging_count < TARGET_COUNT) return true;
      return false;
    });

    if (needsEnrichment.length === 0) continue;

    // Calculate center of the cluster
    const centerLat = needsEnrichment.reduce((sum, c) => sum + c.latitude, 0) / needsEnrichment.length;
    const centerLon = needsEnrichment.reduce((sum, c) => sum + c.longitude, 0) / needsEnrichment.length;

    clusters.push({
      clusterKey: row.cluster_key,
      city: row.city,
      state: row.state,
      centerLat,
      centerLon,
      courses: needsEnrichment,
    });
  }

  // Process each cluster
  const clusterResults: Array<{
    cluster: string;
    coursesInCluster: number;
    coursesEnriched: number;
    diningFound: number;
    lodgingFound: number;
    diningAdded: number;
    lodgingAdded: number;
    error?: string;
  }> = [];

  for (const cluster of clusters) {
    const clusterResult: (typeof clusterResults)[number] = {
      cluster: `${cluster.city}, ${cluster.state}`,
      coursesInCluster: cluster.courses.length,
      coursesEnriched: 0,
      diningFound: 0,
      lodgingFound: 0,
      diningAdded: 0,
      lodgingAdded: 0,
    };

    try {
      const prompt = buildGeoBatchPrompt(
        cluster.city,
        cluster.state,
        cluster.centerLat,
        cluster.centerLon,
        validCategories,
      );

      const content = await callPerplexity(
        "You are a golf travel expert. Find the best restaurants and lodging options in a geographic area. Return only valid JSON with accurate latitude/longitude coordinates.",
        prompt,
      );

      if (!content) {
        clusterResult.error = "Empty API response";
        clusterResults.push(clusterResult);
        await delay(RATE_LIMIT_MS);
        continue;
      }

      const parsed = parseJsonResponse<{
        dining?: GeoDiningItem[];
        lodging?: GeoLodgingItem[];
      }>(content);

      if (!parsed) {
        clusterResult.error = "Failed to parse response";
        clusterResults.push(clusterResult);
        await delay(RATE_LIMIT_MS);
        continue;
      }

      const diningItems = parsed.dining || [];
      const lodgingItems = parsed.lodging || [];
      clusterResult.diningFound = diningItems.length;
      clusterResult.lodgingFound = lodgingItems.length;

      // Assign results to each course in the cluster
      for (const course of cluster.courses) {
        let courseEnriched = false;

        // ── Dining assignment ──
        if (validCategories.includes("dining") && course.dining_count < TARGET_COUNT && diningItems.length > 0) {
          const needed = TARGET_COUNT - course.dining_count;

          // Check existing names for dedup
          const existingDining = await prisma.courseNearbyDining.findMany({
            where: { courseId: course.course_id },
            select: { name: true },
          });
          const existingNames = new Set(existingDining.map((d) => d.name.toLowerCase()));

          // Calculate distance and detect on-property for each item
          const scoredDining = diningItems
            .filter((d) => d.name && !existingNames.has(d.name.toLowerCase()))
            .map((d) => {
              const dist = (d.latitude && d.longitude)
                ? haversineDistance(course.latitude, course.longitude, d.latitude, d.longitude)
                : 5.0; // default distance if coords missing
              const onSite = isOnProperty(d.name, course.course_name, course.facility_name);
              return { ...d, calculatedDistance: onSite ? 0 : dist, isOnSite: onSite };
            })
            .sort((a, b) => {
              if (a.isOnSite && !b.isOnSite) return -1;
              if (!a.isOnSite && b.isOnSite) return 1;
              return (b.rating || 0) - (a.rating || 0);
            })
            .slice(0, needed);

          if (scoredDining.length > 0) {
            await prisma.courseNearbyDining.createMany({
              data: scoredDining.map((d, i) => ({
                courseId: course.course_id,
                name: d.name,
                cuisineType: d.cuisineType || null,
                priceLevel: d.priceLevel || null,
                rating: d.rating || null,
                distanceMiles: d.calculatedDistance,
                description: d.description || null,
                address: d.address || null,
                phone: d.phone || null,
                websiteUrl: d.websiteUrl || null,
                isOnSite: d.isOnSite,
                sortOrder: course.dining_count + i,
              })),
            });
            clusterResult.diningAdded += scoredDining.length;
            courseEnriched = true;
          }
        }

        // ── Lodging assignment ──
        if (validCategories.includes("lodging") && course.lodging_count < TARGET_COUNT && lodgingItems.length > 0) {
          const needed = TARGET_COUNT - course.lodging_count;

          const existingLodging = await prisma.courseNearbyLodging.findMany({
            where: { courseId: course.course_id },
            select: { name: true },
          });
          const existingNames = new Set(existingLodging.map((l) => l.name.toLowerCase()));

          const scoredLodging = lodgingItems
            .filter((l) => l.name && !existingNames.has(l.name.toLowerCase()))
            .map((l) => {
              const dist = (l.latitude && l.longitude)
                ? haversineDistance(course.latitude, course.longitude, l.latitude, l.longitude)
                : 5.0;
              const onSite = isOnProperty(l.name, course.course_name, course.facility_name);
              return { ...l, calculatedDistance: onSite ? 0 : dist, isOnSite: onSite };
            })
            .sort((a, b) => {
              if (a.isOnSite && !b.isOnSite) return -1;
              if (!a.isOnSite && b.isOnSite) return 1;
              return (b.rating || 0) - (a.rating || 0);
            })
            .slice(0, needed);

          if (scoredLodging.length > 0) {
            await prisma.courseNearbyLodging.createMany({
              data: scoredLodging.map((l, i) => ({
                courseId: course.course_id,
                name: l.name,
                lodgingType: l.lodgingType || "Hotel",
                priceTier: l.priceTier || null,
                avgPricePerNight: l.avgPricePerNight || null,
                rating: l.rating || null,
                distanceMiles: l.calculatedDistance,
                description: l.description || null,
                address: l.address || null,
                phone: l.phone || null,
                websiteUrl: l.websiteUrl || null,
                bookingUrl: l.bookingUrl || null,
                isOnSite: l.isOnSite,
                sortOrder: course.lodging_count + i,
              })),
            });
            clusterResult.lodgingAdded += scoredLodging.length;
            courseEnriched = true;
          }
        }

        if (courseEnriched) {
          clusterResult.coursesEnriched++;
        }
      }
    } catch (err: any) {
      clusterResult.error = err.message || "Unknown error";
    }

    clusterResults.push(clusterResult);

    // Rate limit between clusters
    if (clusters.indexOf(cluster) < clusters.length - 1) {
      await delay(RATE_LIMIT_MS);
    }
  }

  const totalCoursesEnriched = clusterResults.reduce((sum, r) => sum + r.coursesEnriched, 0);
  const totalDiningAdded = clusterResults.reduce((sum, r) => sum + r.diningAdded, 0);
  const totalLodgingAdded = clusterResults.reduce((sum, r) => sum + r.lodgingAdded, 0);
  const lastClusterKey = clusterRows[clusterRows.length - 1].cluster_key;

  return NextResponse.json({
    success: true,
    clustersProcessed: clusterResults.length,
    totalCoursesEnriched,
    summary: {
      diningAdded: totalDiningAdded,
      lodgingAdded: totalLodgingAdded,
      apiCallsMade: clusterResults.filter((r) => !r.error || r.error !== "Empty API response").length,
    },
    nextCluster: clusterRows.length === clusterLimit ? lastClusterKey : null,
    results: clusterResults,
  });
}
