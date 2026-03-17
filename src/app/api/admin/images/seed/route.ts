import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SeedEntry {
  course_name: string;
  image_url: string | null;
  photographer?: string;
  list: string;
  ranking: number;
  location?: string;
  access_type?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/golf club/g, "")
    .replace(/golf course/g, "")
    .replace(/country club/g, "")
    .replace(/resort & spa/g, "")
    .replace(/resort/g, "")
    .replace(/state park/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[:.']/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(gdName: string, dbName: string): boolean {
  const a = normalize(gdName);
  const b = normalize(dbName);
  if (a === b) return true;
  // Only allow substring matching if both normalized names are at least 4 chars
  // This prevents "the", "old", "red" from matching everything
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  const wordsA = a.split(" ").filter((w) => w.length > 2);
  const wordsB = b.split(" ").filter((w) => w.length > 2);
  if (wordsA.length > 0 && wordsB.length > 0) {
    const matchCount = wordsA.filter((w) => wordsB.includes(w)).length;
    const minWords = Math.min(wordsA.length, wordsB.length);
    // Require at least 2 matching words if either side has many words
    if (minWords > 0 && matchCount / minWords >= 0.6 && matchCount >= Math.min(2, minWords)) return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Ensure columns exist
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "course_media" ADD COLUMN IF NOT EXISTS "source_url" VARCHAR(500)`
    );

    const body = await request.json();
    const entries: SeedEntry[] = body.entries || body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Expected array of entries" },
        { status: 400 }
      );
    }

    const withImages = entries.filter((e) => e.image_url);

    // Fetch all courses from DB
    const courses = await prisma.course.findMany({
      select: { courseId: true, courseName: true },
    });

    let matched = 0;
    let created = 0;
    let skipped = 0;
    let alreadyExists = 0;
    const details: { course: string; dbMatch: string; status: string }[] = [];

    for (const entry of withImages) {
      const match = courses.find((c) =>
        fuzzyMatch(entry.course_name, c.courseName)
      );

      if (!match) {
        skipped++;
        details.push({
          course: entry.course_name,
          dbMatch: "—",
          status: "no_match",
        });
        continue;
      }

      matched++;

      // Check if record already exists (idempotent)
      const existing = await prisma.courseMedia.findFirst({
        where: {
          courseId: match.courseId,
          sourceName: "Golf Digest",
        },
      });

      if (existing) {
        alreadyExists++;
        details.push({
          course: entry.course_name,
          dbMatch: match.courseName,
          status: "exists",
        });
        continue;
      }

      const sourceUrl =
        entry.list === "public"
          ? "https://www.golfdigest.com/gallery/americas-best-public-courses-702"
          : "https://www.golfdigest.com/gallery/americas-100-greatest-golf-courses-ranking";

      await prisma.courseMedia.create({
        data: {
          courseId: match.courseId,
          url: entry.image_url!,
          mediaType: "image",
          imageType: "HERO",
          credit: entry.photographer || null,
          sourceName: "Golf Digest",
          sourceUrl,
          isPrimary: true,
          isActive: true,
          sortOrder: 0,
        },
      });

      created++;
      details.push({
        course: entry.course_name,
        dbMatch: match.courseName,
        status: "created",
      });
    }

    return NextResponse.json({
      total: withImages.length,
      matched,
      created,
      alreadyExists,
      skipped,
      details,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Failed to seed images", details: String(err) },
      { status: 500 }
    );
  }
}
