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

    const architects = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, slug, era, born_year, died_year, portrait_url, image_url, nationality
       FROM architects WHERE id = $1`,
      architectId
    );

    if (architects.length === 0) {
      return NextResponse.json({ error: "Architect not found" }, { status: 404 });
    }

    const architect = architects[0];

    const outgoing = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        ar.id, ar.relationship_type, ar.description, ar.year_start, ar.year_end,
        a.id AS architect_id, a.name, a.slug, a.era, a.born_year, a.died_year,
        a.portrait_url, a.image_url
      FROM architect_relationships ar
      JOIN architects a ON a.id = ar.to_architect_id
      WHERE ar.from_architect_id = $1
      ORDER BY a.born_year ASC NULLS LAST
    `, architectId);

    const incoming = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        ar.id, ar.relationship_type, ar.description, ar.year_start, ar.year_end,
        a.id AS architect_id, a.name, a.slug, a.era, a.born_year, a.died_year,
        a.portrait_url, a.image_url
      FROM architect_relationships ar
      JOIN architects a ON a.id = ar.from_architect_id
      WHERE ar.to_architect_id = $1
      ORDER BY a.born_year ASC NULLS LAST
    `, architectId);

    const mentors = incoming.filter((r: any) => r.relationship_type === "mentored");
    const influences = incoming.filter((r: any) => r.relationship_type === "influenced");
    const mentees = outgoing.filter((r: any) => r.relationship_type === "mentored");
    const influenced = outgoing.filter((r: any) => r.relationship_type === "influenced");
    const partners = [
      ...incoming.filter((r: any) => r.relationship_type === "partner"),
      ...outgoing.filter((r: any) => r.relationship_type === "partner"),
    ];

    return NextResponse.json({
      architect: {
        id: architect.id,
        name: architect.name,
        slug: architect.slug,
        era: architect.era,
        bornYear: architect.born_year,
        diedYear: architect.died_year,
        portraitUrl: architect.portrait_url,
        imageUrl: architect.image_url,
        nationality: architect.nationality,
      },
      mentors: mentors.map(formatRelationship),
      mentees: mentees.map(formatRelationship),
      influencedBy: influences.map(formatRelationship),
      influenced: influenced.map(formatRelationship),
      partners: partners.map(formatRelationship),
    });
  } catch (error) {
    console.error("GET /api/architects/[slug]/genealogy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatRelationship(r: any) {
  return {
    relationshipId: r.id,
    type: r.relationship_type,
    description: r.description,
    yearStart: r.year_start,
    yearEnd: r.year_end,
    architect: {
      id: r.architect_id,
      name: r.name,
      slug: r.slug,
      era: r.era,
      bornYear: r.born_year,
      diedYear: r.died_year,
      portraitUrl: r.portrait_url,
      imageUrl: r.image_url,
    },
  };
}
