import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const minBunkers = params.get("minBunkers");
  const hasWater = params.get("hasWater");
  const hasCoastal = params.get("hasCoastal");
  const hasIslandGreen = params.get("hasIslandGreen");
  const hasDesert = params.get("hasDesert");
  const minElevation = params.get("minElevation");
  const minAcreage = params.get("minAcreage");
  const routingType = params.get("routingType");
  const limit = Math.min(Number(params.get("limit") || 50), 100);

  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 0;

    if (minBunkers) {
      paramIdx++;
      conditions.push(`sf.bunker_count >= $${paramIdx}`);
      values.push(Number(minBunkers));
    }
    if (hasWater === "true") {
      conditions.push(`sf.water_coverage_pct > 0`);
    }
    if (hasCoastal === "true") {
      conditions.push(`sf.has_coastal_holes = true`);
    }
    if (hasIslandGreen === "true") {
      conditions.push(`sf.has_island_green = true`);
    }
    if (hasDesert === "true") {
      conditions.push(`sf.has_desert_terrain = true`);
    }
    if (minElevation) {
      paramIdx++;
      conditions.push(`sf.elevation_range_ft >= $${paramIdx}`);
      values.push(Number(minElevation));
    }
    if (minAcreage) {
      paramIdx++;
      conditions.push(`sf.total_acreage >= $${paramIdx}`);
      values.push(Number(minAcreage));
    }
    if (routingType) {
      paramIdx++;
      conditions.push(`sf.routing_type = $${paramIdx}`);
      values.push(routingType);
    }

    paramIdx++;
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
      SELECT sf.*, c.name as course_name, c.city, c.state, c."mainImageUrl" as image_url
      FROM "course_satellite_features" sf
      JOIN "Course" c ON c.id = sf.course_id
      ${where}
      ORDER BY sf.bunker_count DESC
      LIMIT $${paramIdx}
    `;
    values.push(limit);

    const results = await prisma.$queryRawUnsafe(query, ...values) as any[];

    return NextResponse.json({
      count: results.length,
      courses: results.map((r: any) => ({
        courseId: r.course_id,
        courseName: r.course_name,
        city: r.city,
        state: r.state,
        imageUrl: r.image_url,
        totalAcreage: r.total_acreage,
        bunkerCount: r.bunker_count,
        waterCoveragePct: r.water_coverage_pct,
        treeCoveragePct: r.tree_coverage_pct,
        elevationRangeFt: r.elevation_range_ft,
        hasIslandGreen: r.has_island_green,
        hasCoastalHoles: r.has_coastal_holes,
        hasDesertTerrain: r.has_desert_terrain,
        routingType: r.routing_type,
      })),
    });
  } catch (error) {
    console.error("Error searching satellite features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
