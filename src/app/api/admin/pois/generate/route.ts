import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import { generatePOIsForCourse } from "@/lib/poi-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/pois/generate
 * Generate POIs for courses
 * Body: { courseIds?: number[], limit?: number, overwrite?: boolean }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const { courseIds, limit = 50, overwrite = false } = body;

  // Fetch courses to generate for
  const where: any = {};
  if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
    if (courseIds.length > 200) {
      return NextResponse.json({ error: "Max 200 courseIds per request" }, { status: 400 });
    }
    where.courseId = { in: courseIds.map(Number) };
  }

  const courses = await prisma.course.findMany({
    where,
    select: {
      courseId: true,
      courseName: true,
      facilityName: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      courseType: true,
      accessType: true,
      onSiteLodging: true,
      resortNameField: true,
      priceTier: true,
      _count: {
        select: {
          nearbyDining: true,
          nearbyLodging: true,
          nearbyAttractions: true,
          nearbyRvParks: true,
        },
      },
    },
    orderBy: [
      { numListsAppeared: "desc" },
      { courseId: "asc" },
    ],
    take: Math.min(limit, 200),
  });

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const course of courses) {
    const hasExisting =
      course._count.nearbyDining > 0 ||
      course._count.nearbyLodging > 0 ||
      course._count.nearbyAttractions > 0 ||
      course._count.nearbyRvParks > 0;

    if (hasExisting && !overwrite) {
      skipped++;
      continue;
    }

    try {
      const pois = generatePOIsForCourse({
        courseId: course.courseId,
        courseName: course.courseName,
        facilityName: course.facilityName,
        city: course.city,
        state: course.state,
        latitude: course.latitude ? Number(course.latitude) : null,
        longitude: course.longitude ? Number(course.longitude) : null,
        courseType: course.courseType,
        accessType: course.accessType,
        onSiteLodging: course.onSiteLodging,
        resortNameField: course.resortNameField,
        priceTier: course.priceTier,
      });

      // If overwriting, delete existing first
      if (hasExisting && overwrite) {
        await Promise.all([
          prisma.courseNearbyDining.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyLodging.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyAttractions.deleteMany({ where: { courseId: course.courseId } }),
          prisma.courseNearbyRvPark.deleteMany({ where: { courseId: course.courseId } }),
        ]);
      }

      // Insert all POIs
      await Promise.all([
        pois.dining.length > 0
          ? prisma.courseNearbyDining.createMany({
              data: pois.dining.map((d) => ({
                courseId: course.courseId,
                name: d.name,
                cuisineType: d.cuisineType,
                priceLevel: d.priceLevel,
                rating: d.rating,
                distanceMiles: d.distanceMiles,
                description: d.description,
                address: d.address || null,
                phone: d.phone || null,
                websiteUrl: d.websiteUrl || null,
                isOnSite: d.isOnSite,
                sortOrder: d.sortOrder,
              })),
            })
          : Promise.resolve(),
        pois.lodging.length > 0
          ? prisma.courseNearbyLodging.createMany({
              data: pois.lodging.map((l) => ({
                courseId: course.courseId,
                name: l.name,
                lodgingType: l.lodgingType,
                priceTier: l.priceTier,
                avgPricePerNight: l.avgPricePerNight,
                rating: l.rating,
                distanceMiles: l.distanceMiles,
                description: l.description,
                address: l.address || null,
                phone: l.phone || null,
                websiteUrl: l.websiteUrl || null,
                bookingUrl: l.bookingUrl || null,
                isOnSite: l.isOnSite,
                isPartner: l.isPartner,
                sortOrder: l.sortOrder,
              })),
            })
          : Promise.resolve(),
        pois.attractions.length > 0
          ? prisma.courseNearbyAttractions.createMany({
              data: pois.attractions.map((a) => ({
                courseId: course.courseId,
                name: a.name,
                category: a.category,
                description: a.description,
                distanceMiles: a.distanceMiles,
                rating: a.rating,
                websiteUrl: a.websiteUrl || null,
                sortOrder: a.sortOrder,
              })),
            })
          : Promise.resolve(),
        pois.rvParks.length > 0
          ? prisma.courseNearbyRvPark.createMany({
              data: pois.rvParks.map((r) => ({
                courseId: course.courseId,
                name: r.name,
                description: r.description,
                distanceMiles: r.distanceMiles,
                driveTimeMinutes: r.driveTimeMinutes,
                rating: r.rating,
                priceLevel: r.priceLevel,
                numSites: r.numSites || null,
                hookups: r.hookups || null,
                amenities: r.amenities || null,
                address: r.address || null,
                phone: r.phone || null,
                websiteUrl: r.websiteUrl || null,
                sortOrder: r.sortOrder,
              })),
            })
          : Promise.resolve(),
      ]);

      generated++;
    } catch (err: any) {
      errors.push(`Course ${course.courseId} (${course.courseName}): ${err.message}`);
    }
  }

  return NextResponse.json({
    total: courses.length,
    generated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
