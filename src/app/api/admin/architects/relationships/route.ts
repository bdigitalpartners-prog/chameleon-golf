import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { relationships } = body;

    if (!Array.isArray(relationships) || relationships.length === 0) {
      return NextResponse.json({ error: "relationships array required" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const rel of relationships) {
      const { fromArchitectId, toArchitectId, relationshipType, description, yearStart, yearEnd } = rel;

      if (!fromArchitectId || !toArchitectId || !relationshipType) {
        skipped++;
        continue;
      }

      try {
        await prisma.$queryRawUnsafe(
          `INSERT INTO architect_relationships
           (from_architect_id, to_architect_id, relationship_type, description, year_start, year_end, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (from_architect_id, to_architect_id, relationship_type) DO UPDATE
           SET description = COALESCE($4, architect_relationships.description),
               year_start = COALESCE($5, architect_relationships.year_start),
               year_end = COALESCE($6, architect_relationships.year_end)`,
          fromArchitectId,
          toArchitectId,
          relationshipType,
          description || null,
          yearStart || null,
          yearEnd || null
        );
        imported++;
      } catch (e) {
        console.error("Skipping relationship:", e);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error) {
    console.error("POST /api/admin/architects/relationships error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
