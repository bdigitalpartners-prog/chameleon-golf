/**
 * Seed Golf Digest course images into CourseMedia.
 *
 * Usage:
 *   npx tsx scripts/seed-golf-digest-images.ts
 *
 * Reads /home/user/workspace/golf_digest_master.json and fuzzy-matches
 * course names to existing courses in the database, then creates
 * CourseMedia records for matched courses.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface GolfDigestEntry {
  ranking: number;
  course_name: string;
  location: string;
  access_type: string;
  list: string;
  image_url: string | null;
  photographer?: string;
}

/**
 * Simple fuzzy match: normalize strings and check if one contains the other
 * or if they share enough similarity.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/golf club/g, "")
    .replace(/golf course/g, "")
    .replace(/country club/g, "")
    .replace(/resort & spa/g, "")
    .replace(/resort/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[:]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(golfDigestName: string, dbName: string): boolean {
  const a = normalize(golfDigestName);
  const b = normalize(dbName);

  // Exact match after normalization
  if (a === b) return true;

  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;

  // Check if the first significant word(s) match
  const wordsA = a.split(" ").filter((w) => w.length > 2);
  const wordsB = b.split(" ").filter((w) => w.length > 2);
  if (wordsA.length > 0 && wordsB.length > 0) {
    const matchCount = wordsA.filter((w) => wordsB.includes(w)).length;
    const minWords = Math.min(wordsA.length, wordsB.length);
    if (minWords > 0 && matchCount / minWords >= 0.6) return true;
  }

  return false;
}

async function main() {
  const dataPath = path.resolve("/home/user/workspace/golf_digest_master.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`Data file not found: ${dataPath}`);
    process.exit(1);
  }

  const entries: GolfDigestEntry[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const withImages = entries.filter((e) => e.image_url);
  console.log(`Loaded ${entries.length} entries, ${withImages.length} have images`);

  // Fetch all courses from DB
  const courses = await prisma.course.findMany({
    select: { courseId: true, courseName: true },
  });
  console.log(`Found ${courses.length} courses in database`);

  let matched = 0;
  let skipped = 0;
  let created = 0;

  for (const entry of withImages) {
    // Find matching course
    const match = courses.find((c) => fuzzyMatch(entry.course_name, c.courseName));
    if (!match) {
      skipped++;
      continue;
    }
    matched++;

    // Check if record already exists (idempotent)
    const existing = await prisma.courseMedia.findFirst({
      where: {
        courseId: match.courseId,
        sourceName: "Golf Digest",
        url: entry.image_url!,
      },
    });

    if (existing) {
      console.log(`  Exists: ${entry.course_name} -> ${match.courseName}`);
      continue;
    }

    // Create media record
    await prisma.courseMedia.create({
      data: {
        courseId: match.courseId,
        url: entry.image_url!,
        mediaType: "image",
        imageType: "HERO",
        credit: entry.photographer || null,
        sourceName: "Golf Digest",
        sourceUrl: "https://www.golfdigest.com/gallery/americas-100-greatest-golf-courses-ranking",
        isPrimary: true,
        isActive: true,
        sortOrder: 0,
        uploadedBy: "seed-script",
      },
    });

    created++;
    console.log(`  Created: ${entry.course_name} -> ${match.courseName}`);
  }

  console.log(`\nDone! Matched: ${matched}, Created: ${created}, No match: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
