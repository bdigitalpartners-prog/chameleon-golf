import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function resolveArchitectId(slugOrId: string): Promise<number | null> {
  const numId = parseInt(slugOrId, 10);
  if (!isNaN(numId)) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM architects WHERE id = $1`, numId
    );
    if (rows.length > 0) return rows[0].id;
  }
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM architects WHERE slug = $1`, slugOrId
  );
  return rows.length > 0 ? rows[0].id : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const architectId = await resolveArchitectId(params.slug);
    if (!architectId) {
      return NextResponse.json({ error: "Architect not found" }, { status: 404 });
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        d.id, d.architect_id,
        d.naturalism, d.strategic_depth, d.visual_drama,
        d.green_complexity, d.bunker_artistry, d.routing_genius,
        d.minimalism, d.playability,
        a.name AS architect_name, a.slug AS architect_slug
       FROM architect_design_dna d
       JOIN architects a ON a.id = d.architect_id
       WHERE d.architect_id = $1`,
      architectId
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "No design DNA found for this architect" }, { status: 404 });
    }

    const dna = rows[0];
    return NextResponse.json({
      architectId: dna.architect_id,
      architectName: dna.architect_name,
      architectSlug: dna.architect_slug,
      dimensions: {
        naturalism: dna.naturalism,
        strategicDepth: dna.strategic_depth,
        visualDrama: dna.visual_drama,
        greenComplexity: dna.green_complexity,
        bunkerArtistry: dna.bunker_artistry,
        routingGenius: dna.routing_genius,
        minimalism: dna.minimalism,
        playability: dna.playability,
      },
    });
  } catch (error) {
    console.error("GET /api/architects/[slug]/design-dna error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
