import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { architectId, batchSize = 50 } = body;

    let architects: { id: number; name: string }[];

    if (architectId) {
      const a = await prisma.architect.findUnique({
        where: { id: architectId },
        select: { id: true, name: true },
      });
      if (!a) return NextResponse.json({ error: "Architect not found" }, { status: 404 });
      architects = [a];
    } else {
      // Get architects with fewest content links
      architects = await prisma.architect.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { externalContent: true } },
        },
        orderBy: { externalContent: { _count: "asc" } },
        take: batchSize,
      });
    }

    const results: { architectId: number; name: string; newLinks: number }[] = [];

    for (const architect of architects) {
      // Search external_content where title or summary contains architect name (case-insensitive)
      const matchingContent = await prisma.externalContent.findMany({
        where: {
          OR: [
            { title: { contains: architect.name, mode: "insensitive" } },
            { summary: { contains: architect.name, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });

      let newLinks = 0;
      for (const content of matchingContent) {
        // Check if link already exists
        const existing = await prisma.contentArchitectLink.findFirst({
          where: { contentId: content.id, architectId: architect.id },
        });
        if (!existing) {
          await prisma.contentArchitectLink.create({
            data: {
              contentId: content.id,
              architectId: architect.id,
              relevance: "auto-matched",
            },
          });
          newLinks++;
        }
      }

      results.push({ architectId: architect.id, name: architect.name, newLinks });
    }

    const totalNew = results.reduce((sum, r) => sum + r.newLinks, 0);

    return NextResponse.json({
      success: true,
      architectsProcessed: results.length,
      totalNewLinks: totalNew,
      results,
    });
  } catch (err: any) {
    console.error("Enrich architect content error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
