import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Bulk nearby enrichment endpoint — accepts dining, lodging, and attractions for multiple courses.
 * POST /api/admin/nearby-enrich
 * Body: {
 *   courses: [{
 *     courseId: number,
 *     dining?: [{ name, cuisineType?, priceLevel?, description?, distanceMiles?, isOnSite?, websiteUrl? }],
 *     lodging?: [{ name, lodgingType?, priceTier?, description?, distanceMiles?, isOnSite?, websiteUrl?, avgPricePerNight? }],
 *     attractions?: [{ name, category?, description?, distanceMiles?, websiteUrl? }]
 *   }]
 * }
 * Auth: x-admin-key header or ?key= query param
 * 
 * Upsert behavior: deletes existing records for each course before inserting new ones (full replace).
 */
export async function POST(req: NextRequest) {
  const key =
    req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const courses: any[] = body.courses;

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { error: "courses array required" },
        { status: 400 }
      );
    }

    if (courses.length > 50) {
      return NextResponse.json(
        { error: "Max 50 courses per batch" },
        { status: 400 }
      );
    }

    const results: {
      courseId: number;
      status: string;
      dining?: number;
      lodging?: number;
      attractions?: number;
      error?: string;
    }[] = [];

    for (const entry of courses) {
      const { courseId, dining, lodging, attractions } = entry;
      if (!courseId) {
        results.push({ courseId: 0, status: "skipped", error: "no courseId" });
        continue;
      }

      try {
        let diningCount = 0;
        let lodgingCount = 0;
        let attractionsCount = 0;

        // Process dining
        if (Array.isArray(dining) && dining.length > 0) {
          // Delete existing dining for this course
          await prisma.courseNearbyDining.deleteMany({
            where: { courseId: Number(courseId) },
          });

          // Insert new dining records
          for (let i = 0; i < dining.length; i++) {
            const d = dining[i];
            if (!d.name) continue;
            await prisma.courseNearbyDining.create({
              data: {
                courseId: Number(courseId),
                name: d.name.substring(0, 255),
                cuisineType: d.cuisineType?.substring(0, 100) || null,
                priceLevel: d.priceLevel?.substring(0, 10) || null,
                rating: d.rating ? parseFloat(d.rating) : null,
                distanceMiles: d.distanceMiles
                  ? parseFloat(d.distanceMiles)
                  : null,
                description: d.description || null,
                address: d.address || null,
                phone: d.phone?.substring(0, 50) || null,
                websiteUrl: d.websiteUrl?.substring(0, 500) || null,
                googleMapsUrl: d.googleMapsUrl?.substring(0, 500) || null,
                isOnSite: d.isOnSite === true || d.isOnSite === "true",
                sortOrder: i,
              },
            });
            diningCount++;
          }
        }

        // Process lodging
        if (Array.isArray(lodging) && lodging.length > 0) {
          await prisma.courseNearbyLodging.deleteMany({
            where: { courseId: Number(courseId) },
          });

          for (let i = 0; i < lodging.length; i++) {
            const l = lodging[i];
            if (!l.name) continue;
            await prisma.courseNearbyLodging.create({
              data: {
                courseId: Number(courseId),
                name: l.name.substring(0, 255),
                lodgingType: l.lodgingType?.substring(0, 50) || null,
                priceTier: l.priceTier?.substring(0, 10) || null,
                avgPricePerNight: l.avgPricePerNight
                  ? parseInt(l.avgPricePerNight)
                  : null,
                rating: l.rating ? parseFloat(l.rating) : null,
                distanceMiles: l.distanceMiles
                  ? parseFloat(l.distanceMiles)
                  : null,
                description: l.description || null,
                address: l.address || null,
                phone: l.phone?.substring(0, 50) || null,
                websiteUrl: l.websiteUrl?.substring(0, 500) || null,
                bookingUrl: l.bookingUrl?.substring(0, 500) || null,
                isOnSite: l.isOnSite === true || l.isOnSite === "true",
                isPartner: l.isPartner === true || l.isPartner === "true",
                sortOrder: i,
              },
            });
            lodgingCount++;
          }
        }

        // Process attractions
        if (Array.isArray(attractions) && attractions.length > 0) {
          await prisma.courseNearbyAttractions.deleteMany({
            where: { courseId: Number(courseId) },
          });

          for (let i = 0; i < attractions.length; i++) {
            const a = attractions[i];
            if (!a.name) continue;
            await prisma.courseNearbyAttractions.create({
              data: {
                courseId: Number(courseId),
                name: a.name.substring(0, 255),
                category: a.category?.substring(0, 100) || null,
                description: a.description || null,
                distanceMiles: a.distanceMiles
                  ? parseFloat(a.distanceMiles)
                  : null,
                websiteUrl: a.websiteUrl?.substring(0, 500) || null,
                googleMapsUrl: a.googleMapsUrl?.substring(0, 500) || null,
                rating: a.rating ? parseFloat(a.rating) : null,
                sortOrder: i,
              },
            });
            attractionsCount++;
          }
        }

        results.push({
          courseId,
          status: "updated",
          dining: diningCount,
          lodging: lodgingCount,
          attractions: attractionsCount,
        });
      } catch (err: any) {
        results.push({ courseId, status: "error", error: err.message });
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const errors = results.filter((r) => r.status === "error").length;
    const totalDining = results.reduce((s, r) => s + (r.dining || 0), 0);
    const totalLodging = results.reduce((s, r) => s + (r.lodging || 0), 0);
    const totalAttractions = results.reduce(
      (s, r) => s + (r.attractions || 0),
      0
    );

    return NextResponse.json({
      success: true,
      total: courses.length,
      updated,
      errors,
      totalDining,
      totalLodging,
      totalAttractions,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/nearby-enrich — Get nearby data coverage stats
 */
export async function GET(req: NextRequest) {
  const key =
    req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(DISTINCT course_id) FROM course_nearby_dining) as courses_with_dining,
        (SELECT COUNT(*) FROM course_nearby_dining) as total_dining_records,
        (SELECT COUNT(DISTINCT course_id) FROM course_nearby_lodging) as courses_with_lodging,
        (SELECT COUNT(*) FROM course_nearby_lodging) as total_lodging_records,
        (SELECT COUNT(DISTINCT course_id) FROM course_nearby_attractions) as courses_with_attractions,
        (SELECT COUNT(*) FROM course_nearby_attractions) as total_attractions_records
    `;

    // Convert BigInt values to numbers for JSON serialization
    const row = stats[0];
    const serialized: Record<string, number> = {};
    for (const [k, v] of Object.entries(row)) {
      serialized[k] = typeof v === 'bigint' ? Number(v) : Number(v) || 0;
    }

    return NextResponse.json({
      success: true,
      stats: serialized,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
