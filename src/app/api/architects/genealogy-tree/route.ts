import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get all relationships with architect info
    const relationships = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        ar.id,
        ar.from_architect_id,
        ar.to_architect_id,
        ar.relationship_type,
        ar.description,
        ar.year_start,
        ar.year_end,
        fa.name AS from_name,
        fa.slug AS from_slug,
        fa.era AS from_era,
        fa.born_year AS from_born_year,
        fa.died_year AS from_died_year,
        fa.portrait_url AS from_portrait_url,
        fa.image_url AS from_image_url,
        ta.name AS to_name,
        ta.slug AS to_slug,
        ta.era AS to_era,
        ta.born_year AS to_born_year,
        ta.died_year AS to_died_year,
        ta.portrait_url AS to_portrait_url,
        ta.image_url AS to_image_url
      FROM architect_relationships ar
      JOIN architects fa ON fa.id = ar.from_architect_id
      JOIN architects ta ON ta.id = ar.to_architect_id
      ORDER BY fa.born_year ASC NULLS LAST, ta.born_year ASC NULLS LAST
    `);

    // Build unique nodes from all architects that appear in relationships
    const nodeMap = new Map<number, any>();

    for (const r of relationships) {
      if (!nodeMap.has(r.from_architect_id)) {
        nodeMap.set(r.from_architect_id, {
          id: r.from_architect_id,
          name: r.from_name,
          slug: r.from_slug,
          era: r.from_era,
          bornYear: r.from_born_year,
          diedYear: r.from_died_year,
          portraitUrl: r.from_portrait_url,
          imageUrl: r.from_image_url,
        });
      }
      if (!nodeMap.has(r.to_architect_id)) {
        nodeMap.set(r.to_architect_id, {
          id: r.to_architect_id,
          name: r.to_name,
          slug: r.to_slug,
          era: r.to_era,
          bornYear: r.to_born_year,
          diedYear: r.to_died_year,
          portraitUrl: r.to_portrait_url,
          imageUrl: r.to_image_url,
        });
      }
    }

    const edges = relationships.map((r: any) => ({
      id: r.id,
      from: r.from_architect_id,
      to: r.to_architect_id,
      type: r.relationship_type,
      description: r.description,
      yearStart: r.year_start,
      yearEnd: r.year_end,
    }));

    return NextResponse.json({
      nodes: Array.from(nodeMap.values()),
      edges,
    });
  } catch (error) {
    console.error("GET /api/architects/genealogy-tree error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
