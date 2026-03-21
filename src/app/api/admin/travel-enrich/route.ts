import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

interface TravelData {
  lodging: Array<{
    name: string;
    type: string;
    distanceMiles: number;
    priceRange: string;
    rating: number;
    description: string;
    isGolfPackage: boolean;
    isOnSite?: boolean;
    phone?: string;
    address?: string;
    websiteUrl?: string;
    bookingUrl?: string;
  }>;
  dining: Array<{
    name: string;
    cuisineType: string;
    distanceMiles: number;
    priceRange: string;
    rating: number;
    description: string;
    isOnSite?: boolean;
    phone?: string;
    address?: string;
    websiteUrl?: string;
  }>;
  attractions: Array<{
    name: string;
    type: string;
    distanceMiles: number;
    description: string;
    phone?: string;
    address?: string;
  }>;
  airports: Array<{
    name: string;
    code: string;
    type: string;
    distanceMiles: number;
    driveTimeMinutes: number;
    hasFBO: boolean;
    fboName?: string;
    fboPhone?: string;
    majorAirlines?: string;
    longestRunwayFt?: number;
  }>;
  metroDistances: Array<{
    metroName: string;
    distanceMiles: number;
    driveTimeMinutes: number;
  }>;
}

function buildTravelPrompt(course: {
  courseName: string;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  const location = [course.city, course.state, course.country].filter(Boolean).join(", ");
  const coords = course.latitude && course.longitude
    ? `Coordinates: ${course.latitude}, ${course.longitude}`
    : "";

  return `You are a golf travel expert. Research travel and stay options near "${course.courseName}" in ${location}. ${coords}

Generate realistic, location-appropriate recommendations. Return a JSON object with these sections:

{
  "lodging": [
    {
      "name": "Hotel/Resort Name",
      "type": "Hotel | Resort | B&B | Vacation Rental | RV Park | Campground",
      "distanceMiles": 5.2,
      "priceRange": "$ | $$ | $$$ | $$$$",
      "rating": 4.5,
      "description": "Brief description",
      "isGolfPackage": false,
      "phone": "(555) 123-4567",
      "address": "123 Main St, City, ST"
    }
  ],
  "dining": [
    {
      "name": "Restaurant Name",
      "cuisineType": "American | Seafood | Italian | etc.",
      "distanceMiles": 2.1,
      "priceRange": "$ | $$ | $$$ | $$$$",
      "rating": 4.3,
      "description": "Brief description",
      "phone": "(555) 123-4567",
      "address": "456 Oak Ave, City, ST"
    }
  ],
  "attractions": [
    {
      "name": "Attraction Name",
      "type": "Golf Museum | Shopping | Beach | State Park | Winery | Entertainment | Historical Site | Scenic Drive",
      "distanceMiles": 8.0,
      "description": "Brief description",
      "phone": "(555) 123-4567",
      "address": "789 Pine Dr, City, ST"
    }
  ],
  "airports": [
    {
      "name": "Airport Name",
      "code": "ABC",
      "type": "Commercial | Regional | Private/FBO",
      "distanceMiles": 25.0,
      "driveTimeMinutes": 30,
      "hasFBO": true,
      "fboName": "FBO Name if applicable",
      "fboPhone": "(555) 123-4567",
      "majorAirlines": "Delta, United, American",
      "longestRunwayFt": 8000
    }
  ],
  "metroDistances": [
    {
      "metroName": "City Name",
      "distanceMiles": 120,
      "driveTimeMinutes": 120
    }
  ]
}

IMPORTANT REQUIREMENTS:
1. Include up to 10 lodging options, sorted by highest rated first. You MUST include at least one RV Park or Campground where geographically appropriate (this is a specific owner requirement). Include a variety: hotels, resorts, B&Bs, vacation rentals. If the golf course has on-site/on-property lodging (resort rooms, cottages, cabins on the property), list them FIRST and mark them as on-site by adding "isOnSite": true. Pick the highest rated lodging options available.
2. Include up to 10 restaurant recommendations with varied cuisine types, sorted by highest rated first. If the golf course has on-site/on-property restaurants (at the clubhouse, resort, or facility), list them FIRST and mark them as on-site by adding "isOnSite": true. Pick the highest rated restaurants available.
3. Include 3-5 nearby attractions (mix of golf-related and general tourism).
4. Include the nearest commercial airport AND the nearest private airport/FBO. If there's an FBO at or near a commercial airport, include that info too. FBO information is a KEY differentiator - be thorough with FBO details.
5. Include drive times from 3-5 nearest major metro areas.
6. All distances should be realistic for the location.
7. For lodging, mark isGolfPackage=true if the property is known to offer golf packages with the course.
8. Return ONLY valid JSON, no markdown or extra text.`;
}

function parseTravelResponse(text: string): TravelData | null {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const data = JSON.parse(cleaned);
    return {
      lodging: Array.isArray(data.lodging) ? data.lodging : [],
      dining: Array.isArray(data.dining) ? data.dining : [],
      attractions: Array.isArray(data.attractions) ? data.attractions : [],
      airports: Array.isArray(data.airports) ? data.airports : [],
      metroDistances: Array.isArray(data.metroDistances) ? data.metroDistances : [],
    };
  } catch {
    return null;
  }
}

function priceTierFromRange(range: string): string {
  const map: Record<string, string> = { "$": "$", "$$": "$$", "$$$": "$$$", "$$$$": "$$$$" };
  return map[range] || "$$";
}

function lodgingTypeFromType(type: string): string {
  const map: Record<string, string> = {
    "Hotel": "Hotel",
    "Resort": "Resort",
    "B&B": "B&B",
    "Vacation Rental": "Vacation Rental",
    "RV Park": "RV Park",
    "Campground": "Campground",
  };
  return map[type] || "Hotel";
}

/**
 * POST /api/admin/travel-enrich
 * Enrich courses with travel & stay data using AI
 * Body: { courseIds?: number[], limit?: number, overwrite?: boolean }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: "PERPLEXITY_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { courseIds, limit = 20, overwrite = false } = body;

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
      latitude: true,
      longitude: true,
      _count: {
        select: {
          nearbyDining: true,
          nearbyLodging: true,
          nearbyAttractions: true,
          nearbyRvParks: true,
          nearbyMetroDistances: true,
        },
      },
    },
    orderBy: [
      { numListsAppeared: "desc" },
      { courseId: "asc" },
    ],
    take: Math.min(limit, 100),
  });

  let enriched = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const course of courses) {
    const hasExisting =
      course._count.nearbyDining > 0 ||
      course._count.nearbyLodging > 0 ||
      course._count.nearbyAttractions > 0 ||
      course._count.nearbyRvParks > 0 ||
      course._count.nearbyMetroDistances > 0;

    if (hasExisting && !overwrite) {
      skipped++;
      continue;
    }

    try {
      const prompt = buildTravelPrompt({
        courseName: course.courseName,
        city: course.city,
        state: course.state,
        country: course.country,
        latitude: course.latitude ? Number(course.latitude) : null,
        longitude: course.longitude ? Number(course.longitude) : null,
      });

      const response = await fetch(PERPLEXITY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: "You are a golf travel research assistant. Return only valid JSON. Be accurate and thorough, especially with FBO and airport information.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        errors.push(`Course ${course.courseId} (${course.courseName}): API error ${response.status} — ${errText.slice(0, 200)}`);
        continue;
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) {
        errors.push(`Course ${course.courseId} (${course.courseName}): Empty API response`);
        continue;
      }

      const travelData = parseTravelResponse(content);
      if (!travelData) {
        errors.push(`Course ${course.courseId} (${course.courseName}): Failed to parse API response`);
        continue;
      }

      // Delete existing data if overwriting
      if (hasExisting && overwrite) {
        await Promise.all([
          prisma.courseNearbyDining.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyLodging.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyAttractions.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyRvParks.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyMetroDistance.deleteMany({ where: { courseId: course.courseId } }),
        ]);
      }

      // Separate RV Parks from regular lodging
      const rvParks = travelData.lodging.filter(
        (l) => l.type === "RV Park" || l.type === "Campground"
      );
      const regularLodging = travelData.lodging.filter(
        (l) => l.type !== "RV Park" && l.type !== "Campground"
      );

      // Sort dining: on-site first, then by rating descending
      const sortedDining = [...travelData.dining].sort((a, b) => {
        if (a.isOnSite && !b.isOnSite) return -1;
        if (!a.isOnSite && b.isOnSite) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      // Sort regular lodging: on-site first, then by rating descending
      const sortedRegularLodging = [...regularLodging].sort((a, b) => {
        if (a.isOnSite && !b.isOnSite) return -1;
        if (!a.isOnSite && b.isOnSite) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      // Save all data
      await Promise.all([
        // Dining
        sortedDining.length > 0
          ? prisma.courseNearbyDining.createMany({
              data: sortedDining.map((d, i) => ({
                courseId: course.courseId,
                name: d.name,
                cuisineType: d.cuisineType || null,
                priceLevel: priceTierFromRange(d.priceRange),
                rating: d.rating || null,
                distanceMiles: d.distanceMiles || null,
                description: d.description || null,
                address: d.address || null,
                phone: d.phone || null,
                websiteUrl: d.websiteUrl || null,
                isOnSite: d.isOnSite || false,
                sortOrder: i,
              })),
            })
          : Promise.resolve(),

        // Lodging (non-RV)
        sortedRegularLodging.length > 0
          ? prisma.courseNearbyLodging.createMany({
              data: sortedRegularLodging.map((l, i) => ({
                courseId: course.courseId,
                name: l.name,
                lodgingType: lodgingTypeFromType(l.type),
                priceTier: priceTierFromRange(l.priceRange),
                rating: l.rating || null,
                distanceMiles: l.distanceMiles || null,
                description: l.description || null,
                address: l.address || null,
                phone: l.phone || null,
                websiteUrl: l.websiteUrl || null,
                bookingUrl: l.bookingUrl || null,
                isOnSite: l.isOnSite || false,
                isGolfPackage: l.isGolfPackage || false,
                sortOrder: i,
              })),
            })
          : Promise.resolve(),

        // RV Parks
        rvParks.length > 0
          ? prisma.courseNearbyRvParks.createMany({
              data: rvParks.map((r, i) => ({
                courseId: course.courseId,
                name: r.name,
                description: r.description || null,
                distanceMiles: r.distanceMiles || null,
                rating: r.rating || null,
                priceLevel: priceTierFromRange(r.priceRange),
                address: r.address || null,
                phone: r.phone || null,
                sortOrder: i,
              })),
            })
          : Promise.resolve(),

        // Attractions
        travelData.attractions.length > 0
          ? prisma.courseNearbyAttractions.createMany({
              data: travelData.attractions.map((a, i) => ({
                courseId: course.courseId,
                name: a.name,
                category: a.type || null,
                description: a.description || null,
                distanceMiles: a.distanceMiles || null,
                address: a.address || null,
                sortOrder: i,
              })),
            })
          : Promise.resolve(),

        // Metro Distances
        travelData.metroDistances.length > 0
          ? prisma.courseNearbyMetroDistance.createMany({
              data: travelData.metroDistances.map((m) => ({
                courseId: course.courseId,
                metroName: m.metroName,
                distanceMiles: m.distanceMiles || null,
                driveTimeMinutes: m.driveTimeMinutes || null,
              })),
              skipDuplicates: true,
            })
          : Promise.resolve(),
      ]);

      // Update airport proximity data from AI response
      if (travelData.airports.length > 0) {
        for (const ap of travelData.airports) {
          if (!ap.name || !ap.code) continue;
          try {
            // Find or create airport
            let airport = await prisma.airport.findFirst({
              where: {
                OR: [
                  { iataCode: ap.code },
                  { airportName: ap.name },
                ],
              },
            });

            if (!airport) {
              airport = await prisma.airport.create({
                data: {
                  airportName: ap.name,
                  iataCode: ap.code || null,
                  airportType: ap.type || "Commercial",
                  hasFbo: ap.hasFBO || false,
                  fboNames: ap.fboName || null,
                  longestRunwayFt: ap.longestRunwayFt || null,
                  hasScheduledService: ap.type === "Commercial" || ap.type === "Regional",
                },
              });
            } else {
              // Update FBO info if we have new data
              if (ap.hasFBO && !airport.hasFbo) {
                await prisma.airport.update({
                  where: { airportId: airport.airportId },
                  data: {
                    hasFbo: true,
                    fboNames: ap.fboName || airport.fboNames,
                    longestRunwayFt: ap.longestRunwayFt || airport.longestRunwayFt,
                  },
                });
              }
            }

            // Create proximity record
            await prisma.courseAirportProximity.upsert({
              where: {
                courseId_airportId: {
                  courseId: course.courseId,
                  airportId: airport.airportId,
                },
              },
              create: {
                courseId: course.courseId,
                airportId: airport.airportId,
                distanceMiles: ap.distanceMiles,
                driveTimeMinutes: ap.driveTimeMinutes || null,
              },
              update: {
                distanceMiles: ap.distanceMiles,
                driveTimeMinutes: ap.driveTimeMinutes || null,
              },
            });
          } catch (airportErr: any) {
            // Non-fatal: airport save failed
            console.error(`Airport save error for ${ap.name}:`, airportErr.message);
          }
        }
      }

      enriched++;
    } catch (err: any) {
      errors.push(`Course ${course.courseId} (${course.courseName}): ${err.message}`);
    }
  }

  return NextResponse.json({
    total: courses.length,
    enriched,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/admin/travel-enrich
 * Get travel enrichment coverage stats
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const totalCourses = await prisma.course.count();

  const [
    withDining,
    withLodging,
    withAttractions,
    withRvParks,
    withAirports,
    withMetro,
  ] = await Promise.all([
    prisma.courseNearbyDining.groupBy({ by: ["courseId"], _count: true }).then((r) => r.length),
    prisma.courseNearbyLodging.groupBy({ by: ["courseId"], _count: true }).then((r) => r.length),
    prisma.courseNearbyAttractions.groupBy({ by: ["courseId"], _count: true }).then((r) => r.length),
    prisma.courseNearbyRvParks.groupBy({ by: ["courseId"], _count: true }).then((r) => r.length),
    prisma.courseAirportProximity.groupBy({ by: ["courseId"], _count: true }).then((r) => r.length),
    prisma.courseNearbyMetroDistance.groupBy({ by: ["courseId"], _count: true }).then((r) => r.length),
  ]);

  return NextResponse.json({
    totalCourses,
    coverage: {
      dining: { count: withDining, pct: totalCourses > 0 ? Math.round((withDining / totalCourses) * 100) : 0 },
      lodging: { count: withLodging, pct: totalCourses > 0 ? Math.round((withLodging / totalCourses) * 100) : 0 },
      attractions: { count: withAttractions, pct: totalCourses > 0 ? Math.round((withAttractions / totalCourses) * 100) : 0 },
      rvParks: { count: withRvParks, pct: totalCourses > 0 ? Math.round((withRvParks / totalCourses) * 100) : 0 },
      airports: { count: withAirports, pct: totalCourses > 0 ? Math.round((withAirports / totalCourses) * 100) : 0 },
      metroDistances: { count: withMetro, pct: totalCourses > 0 ? Math.round((withMetro / totalCourses) * 100) : 0 },
    },
  });
}
