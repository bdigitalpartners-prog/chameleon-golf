import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  try {
    const features = await prisma.$queryRawUnsafe(
      `SELECT sf.*, c.name as course_name, c.city, c.state, c."mainImageUrl" as image_url
       FROM "course_satellite_features" sf
       JOIN "Course" c ON c.id = sf.course_id
       WHERE sf.course_id = $1`,
      Number(courseId)
    ) as any[];

    if (!features || features.length === 0) {
      return NextResponse.json({ error: "Features not found" }, { status: 404 });
    }

    const f = features[0];

    // Get averages for comparison
    const avgs = await prisma.$queryRawUnsafe(
      `SELECT
         AVG(bunker_count) as avg_bunkers,
         AVG(water_coverage_pct) as avg_water,
         AVG(tree_coverage_pct) as avg_trees,
         AVG(elevation_range_ft) as avg_elevation,
         AVG(total_acreage) as avg_acreage
       FROM "course_satellite_features"`
    ) as any[];

    const avg = avgs[0] || {};

    return NextResponse.json({
      courseId: f.course_id,
      courseName: f.course_name,
      city: f.city,
      state: f.state,
      imageUrl: f.image_url,
      features: {
        totalAcreage: f.total_acreage,
        waterFeatureCount: f.water_feature_count,
        waterCoveragePct: f.water_coverage_pct,
        bunkerCount: f.bunker_count,
        bunkerCoveragePct: f.bunker_coverage_pct,
        treeCoveragePct: f.tree_coverage_pct,
        elevationRangeFt: f.elevation_range_ft,
        hasIslandGreen: f.has_island_green,
        hasCoastalHoles: f.has_coastal_holes,
        hasDesertTerrain: f.has_desert_terrain,
        routingType: f.routing_type,
        analysisDate: f.analysis_date,
        confidenceScore: f.confidence_score,
      },
      averages: {
        bunkerCount: Math.round(avg.avg_bunkers || 0),
        waterCoveragePct: +(avg.avg_water || 0).toFixed(1),
        treeCoveragePct: +(avg.avg_trees || 0).toFixed(1),
        elevationRangeFt: Math.round(avg.avg_elevation || 0),
        totalAcreage: Math.round(avg.avg_acreage || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching satellite features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
