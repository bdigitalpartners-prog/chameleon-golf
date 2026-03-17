import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface BulkEntry {
  courseId: number;
  imageUrl: string;
  credit?: string;
  sourceUrl?: string;
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "source_url" VARCHAR(500)`
    );

    const body = await request.json();
    const entries: BulkEntry[] = body.entries || body;

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "Expected array of entries" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const details: { courseId: number; status: string; error?: string }[] = [];

    for (const entry of entries) {
      try {
        const existing = await prisma.courseMedia.findFirst({
          where: { courseId: entry.courseId, sourceName: "Golf Digest" },
        });

        if (existing) {
          skipped++;
          details.push({ courseId: entry.courseId, status: "exists" });
          continue;
        }

        await prisma.courseMedia.create({
          data: {
            courseId: entry.courseId,
            url: entry.imageUrl,
            mediaType: "image",
            imageType: "HERO",
            credit: entry.credit || null,
            sourceName: "Golf Digest",
            sourceUrl: entry.sourceUrl || "https://www.golfdigest.com/gallery/americas-100-greatest-golf-courses-ranking",
            isPrimary: true,
            isActive: true,
            sortOrder: 0,
          },
        });
        created++;
        details.push({ courseId: entry.courseId, status: "created" });
      } catch (err) {
        details.push({ courseId: entry.courseId, status: "error", error: String(err) });
      }
    }

    return NextResponse.json({ total: entries.length, created, skipped, details });
  } catch (err) {
    console.error("Bulk create error:", err);
    return NextResponse.json({ error: "Failed", details: String(err) }, { status: 500 });
  }
}
