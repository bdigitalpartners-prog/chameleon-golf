import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Ensure course_media columns exist for Golf Digest image integration
    await prisma.$executeRawUnsafe(`ALTER TABLE course_media ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
    await prisma.$executeRawUnsafe(`ALTER TABLE course_media ADD COLUMN IF NOT EXISTS source_url VARCHAR(500)`);

    const { searchParams } = new URL(request.url);
    const activeFilter = searchParams.get("isActive");

    const where: Record<string, unknown> = {
      sourceName: { not: null },
    };

    if (activeFilter === "true") {
      where.isActive = true;
    } else if (activeFilter === "false") {
      where.isActive = false;
    }

    const images = await prisma.courseMedia.findMany({
      where,
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
          },
        },
      },
      orderBy: [{ sourceName: "asc" }, { createdAt: "desc" }],
    });

    // Group by source with counts
    const sourceGroups: Record<string, { total: number; active: number }> = {};
    for (const img of images) {
      const src = img.sourceName || "Unknown";
      if (!sourceGroups[src]) {
        sourceGroups[src] = { total: 0, active: 0 };
      }
      sourceGroups[src].total++;
      if (img.isActive) sourceGroups[src].active++;
    }

    return NextResponse.json({ images, sourceGroups });
  } catch (err) {
    console.error("Images list error:", err);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
