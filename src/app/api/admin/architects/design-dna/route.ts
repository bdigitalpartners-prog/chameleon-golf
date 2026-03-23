import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "entries array required" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const entry of entries) {
      const {
        architectId,
        naturalism = 50,
        strategicDepth = 50,
        visualDrama = 50,
        greenComplexity = 50,
        bunkerArtistry = 50,
        routingGenius = 50,
        minimalism = 50,
        playability = 50,
      } = entry;

      if (!architectId) {
        skipped++;
        continue;
      }

      try {
        await prisma.$queryRawUnsafe(
          `INSERT INTO architect_design_dna
           (architect_id, naturalism, strategic_depth, visual_drama, green_complexity,
            bunker_artistry, routing_genius, minimalism, playability, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           ON CONFLICT (architect_id) DO UPDATE
           SET naturalism = $2, strategic_depth = $3, visual_drama = $4, green_complexity = $5,
               bunker_artistry = $6, routing_genius = $7, minimalism = $8, playability = $9,
               updated_at = NOW()`,
          architectId,
          naturalism,
          strategicDepth,
          visualDrama,
          greenComplexity,
          bunkerArtistry,
          routingGenius,
          minimalism,
          playability
        );
        imported++;
      } catch (e) {
        console.error("Skipping DNA entry:", e);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error) {
    console.error("POST /api/admin/architects/design-dna error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
