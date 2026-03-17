import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "all";
    const state = url.searchParams.get("state") || undefined;
    const architect = url.searchParams.get("architect") || undefined;
    const access = url.searchParams.get("access") || undefined;
    const courseType = url.searchParams.get("courseType") || undefined;
    const priceMin = url.searchParams.get("priceMin")
      ? parseFloat(url.searchParams.get("priceMin")!)
      : undefined;
    const priceMax = url.searchParams.get("priceMax")
      ? parseFloat(url.searchParams.get("priceMax")!)
      : undefined;
    const minLists = url.searchParams.get("minLists")
      ? parseInt(url.searchParams.get("minLists")!)
      : undefined;
    const search = url.searchParams.get("search") || undefined;
    const near = url.searchParams.get("near") || undefined;
    const radius = parseFloat(url.searchParams.get("radius") ?? "50");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "500"),
      2000
    );

    const conditions: Prisma.Sql[] = [
      Prisma.sql`c.latitude IS NOT NULL AND c.longitude IS NOT NULL`,
    ];

    // Preset queries – top100/top50 use a subquery to pick the N most-ranked courses
    let presetLimit: number | null = null;
    if (query === "top100") {
      conditions.push(Prisma.sql`c.num_lists_appeared > 0`);
      presetLimit = 100;
    } else if (query === "top50") {
      conditions.push(Prisma.sql`c.num_lists_appeared > 0`);
      presetLimit = 50;
    } else if (query === "hidden-gems") {
      conditions.push(
        Prisma.sql`c.num_lists_appeared <= 1 AND c.access_type = 'Open to Public'`
      );
    } else if (query === "bucket-list") {
      conditions.push(Prisma.sql`c.num_lists_appeared >= 3`);
    }

    // Standard filters
    if (state) conditions.push(Prisma.sql`c.state = ${state}`);
    if (architect)
      conditions.push(
        Prisma.sql`c.original_architect ILIKE ${"%" + architect + "%"}`
      );
    if (access) conditions.push(Prisma.sql`c.access_type = ${access}`);
    if (courseType) conditions.push(Prisma.sql`c.course_type = ${courseType}`);
    if (priceMin !== undefined)
      conditions.push(Prisma.sql`c.green_fee_high >= ${priceMin}`);
    if (priceMax !== undefined)
      conditions.push(Prisma.sql`c.green_fee_high <= ${priceMax}`);
    if (minLists !== undefined)
      conditions.push(Prisma.sql`c.num_lists_appeared >= ${minLists}`);
    if (search)
      conditions.push(
        Prisma.sql`c.course_name ILIKE ${"%" + search + "%"}`
      );

    // Proximity search
    let distanceSelect = Prisma.sql``;
    let orderClause = Prisma.sql`ORDER BY c.num_lists_appeared DESC NULLS LAST, c.course_name ASC`;

    if (near) {
      const parts = near.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Haversine distance in miles
          distanceSelect = Prisma.sql`,
            (3959 * acos(
              cos(radians(${lat})) * cos(radians(c.latitude::float)) *
              cos(radians(c.longitude::float) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(c.latitude::float))
            )) AS distance_miles`;
          conditions.push(
            Prisma.sql`(3959 * acos(
              cos(radians(${lat})) * cos(radians(c.latitude::float)) *
              cos(radians(c.longitude::float) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(c.latitude::float))
            )) <= ${radius}`
          );
          orderClause = Prisma.sql`ORDER BY distance_miles ASC`;
        }
      }
    }

    const whereClause = conditions.reduce(
      (acc, cond) => Prisma.sql`${acc} AND ${cond}`
    );

    type MapRow = {
      course_id: bigint;
      course_name: string;
      facility_name: string | null;
      latitude: string;
      longitude: string;
      city: string | null;
      state: string | null;
      course_type: string | null;
      access_type: string | null;
      price_tier: string | null;
      green_fee_high: string | null;
      num_lists_appeared: number | null;
      original_architect: string | null;
      par: number | null;
      num_holes: number | null;
      overall_score: string | null;
      total_count: bigint;
    };

    const rows = await prisma.$queryRaw<MapRow[]>(Prisma.sql`
      SELECT
        c.course_id,
        c.course_name,
        c.facility_name,
        c.latitude::text,
        c.longitude::text,
        c.city,
        c.state,
        c.course_type,
        c.access_type,
        c.price_tier,
        c.green_fee_high::text,
        c.num_lists_appeared,
        c.original_architect,
        c.par,
        c.num_holes,
        cs.chameleon_score::text AS overall_score
        ${distanceSelect},
        COUNT(*) OVER() AS total_count
      FROM courses c
      LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
      WHERE ${whereClause}
      ${orderClause}
      LIMIT ${presetLimit != null ? Math.min(presetLimit, limit) : limit}
    `);

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    const items = rows.map((r) => ({
      courseId: Number(r.course_id),
      courseName: r.course_name,
      facilityName: r.facility_name,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      city: r.city,
      state: r.state,
      courseType: r.course_type,
      accessType: r.access_type,
      priceTier: r.price_tier,
      greenFeeHigh: r.green_fee_high ? parseFloat(r.green_fee_high) : null,
      numListsAppeared: r.num_lists_appeared,
      originalArchitect: r.original_architect,
      par: r.par,
      numHoles: r.num_holes,
      overallScore: r.overall_score ? parseFloat(r.overall_score) : null,
    }));

    return NextResponse.json({ items, total });
  } catch (error: any) {
    console.error("GET /api/courses/map error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
