import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { features } = body;

    if (!features || !Array.isArray(features)) {
      return NextResponse.json({ error: "features array required" }, { status: 400 });
    }

    let imported = 0;
    for (const f of features) {
      if (!f.courseId) continue;

      await prisma.$executeRawUnsafe(
        `INSERT INTO "course_satellite_features"
          (course_id, total_acreage, water_feature_count, water_coverage_pct, bunker_count,
           bunker_coverage_pct, tree_coverage_pct, elevation_range_ft, has_island_green,
           has_coastal_holes, has_desert_terrain, routing_type, analysis_date, confidence_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (course_id) DO UPDATE SET
           total_acreage = EXCLUDED.total_acreage,
           water_feature_count = EXCLUDED.water_feature_count,
           water_coverage_pct = EXCLUDED.water_coverage_pct,
           bunker_count = EXCLUDED.bunker_count,
           bunker_coverage_pct = EXCLUDED.bunker_coverage_pct,
           tree_coverage_pct = EXCLUDED.tree_coverage_pct,
           elevation_range_ft = EXCLUDED.elevation_range_ft,
           has_island_green = EXCLUDED.has_island_green,
           has_coastal_holes = EXCLUDED.has_coastal_holes,
           has_desert_terrain = EXCLUDED.has_desert_terrain,
           routing_type = EXCLUDED.routing_type,
           analysis_date = EXCLUDED.analysis_date,
           confidence_score = EXCLUDED.confidence_score,
           updated_at = CURRENT_TIMESTAMP`,
        f.courseId,
        f.totalAcreage || null,
        f.waterFeatureCount || null,
        f.waterCoveragePct || null,
        f.bunkerCount || null,
        f.bunkerCoveragePct || null,
        f.treeCoveragePct || null,
        f.elevationRangeFt || null,
        f.hasIslandGreen || false,
        f.hasCoastalHoles || false,
        f.hasDesertTerrain || false,
        f.routingType || null,
        f.analysisDate || new Date().toISOString().split("T")[0],
        f.confidenceScore || null
      );
      imported++;
    }

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    console.error("Error importing satellite data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
