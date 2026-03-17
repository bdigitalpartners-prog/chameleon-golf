import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SEED_USER_ID = "seed_user_golfeq_community";
const SEED_USER_EMAIL = "seed-reviews@golfeq.ai";
const SEED_USER_NAME = "GolfEQ Community";

interface SeedReview {
  reviewer_name: string;
  review_title: string;
  review_text: string;
  rating_out_of_5: number;
  review_date: string;
  source_url: string;
}

interface SeedEntity {
  entity: string;
  course_name: string;
  source_site: string;
  reviews: SeedReview[];
}

function generateSubRating(overall: number): number {
  const variation = (Math.random() - 0.5) * 1.0; // +/- 0.5
  const raw = overall + variation;
  const clamped = Math.max(1.0, Math.min(5.0, raw));
  return Math.round(clamped * 2) / 2; // Round to nearest 0.5
}

function parseReviewDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Format: MM/DD/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(d.getTime())) return d;
  }
  // Try ISO format
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function loadSeedData(): SeedEntity[] {
  // Try public directory first (Next.js project)
  const publicPath = path.join(process.cwd(), "public", "seed_reviews_data.json");
  if (fs.existsSync(publicPath)) {
    return JSON.parse(fs.readFileSync(publicPath, "utf-8"));
  }
  // Fallback: workspace root
  const workspacePath = "/home/user/workspace/seed_reviews_data.json";
  if (fs.existsSync(workspacePath)) {
    return JSON.parse(fs.readFileSync(workspacePath, "utf-8"));
  }
  throw new Error("seed_reviews_data.json not found in public/ or workspace root");
}

async function findCourseByName(entityName: string): Promise<{ courseId: number; courseName: string } | null> {
  // 1. Exact match
  const exact = await prisma.course.findFirst({
    where: { courseName: entityName },
    select: { courseId: true, courseName: true },
  });
  if (exact) return exact;

  // 2. ILIKE partial match using the entity name
  const ilike: any[] = await prisma.$queryRaw`
    SELECT course_id as "courseId", course_name as "courseName"
    FROM courses
    WHERE course_name ILIKE ${"%" + entityName + "%"}
    LIMIT 1
  `;
  if (ilike.length > 0) return ilike[0];

  // 3. Try splitting words and matching with key terms
  const words = entityName.split(/\s+/).filter((w) => w.length > 2);
  if (words.length >= 2) {
    // Build pattern from first two significant words
    const pattern = "%" + words.join("%") + "%";
    const fuzzy: any[] = await prisma.$queryRaw`
      SELECT course_id as "courseId", course_name as "courseName"
      FROM courses
      WHERE course_name ILIKE ${pattern}
      LIMIT 1
    `;
    if (fuzzy.length > 0) return fuzzy[0];
  }

  return null;
}

/**
 * POST - Seed reviews from the JSON data file
 */
export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Ensure seed review columns exist
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "is_seed" BOOLEAN NOT NULL DEFAULT false`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_source" VARCHAR(200)`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_reviewer_name" VARCHAR(200)`
    );

    // Upsert seed user
    await prisma.user.upsert({
      where: { id: SEED_USER_ID },
      update: { name: SEED_USER_NAME, email: SEED_USER_EMAIL, role: "system" },
      create: {
        id: SEED_USER_ID,
        name: SEED_USER_NAME,
        email: SEED_USER_EMAIL,
        role: "system",
      },
    });

    const seedData = loadSeedData();

    let created = 0;
    let skipped = 0;
    let noMatch = 0;
    const errors: string[] = [];
    const matchDetails: { entity: string; dbMatch: string | null; reviewsCreated: number; reviewsSkipped: number }[] = [];

    for (const entity of seedData) {
      const course = await findCourseByName(entity.entity);

      if (!course) {
        noMatch++;
        matchDetails.push({
          entity: entity.entity,
          dbMatch: null,
          reviewsCreated: 0,
          reviewsSkipped: entity.reviews.length,
        });
        continue;
      }

      let entityCreated = 0;
      let entitySkipped = 0;

      for (const review of entity.reviews) {
        try {
          // Check for duplicate: same seedReviewerName + same courseId
          const existing = await prisma.userCourseRating.findFirst({
            where: {
              courseId: course.courseId,
              seedReviewerName: review.reviewer_name,
              isSeed: true,
            },
          });

          if (existing) {
            entitySkipped++;
            skipped++;
            continue;
          }

          const reviewDate = parseReviewDate(review.review_date);
          const now = new Date();
          const createdAt = reviewDate || now;
          const seedSource = `${entity.source_site} | ${review.source_url}`;

          await prisma.userCourseRating.create({
            data: {
              userId: SEED_USER_ID,
              courseId: course.courseId,
              overallRating: review.rating_out_of_5,
              conditioning: generateSubRating(review.rating_out_of_5),
              layoutDesign: generateSubRating(review.rating_out_of_5),
              paceOfPlay: generateSubRating(review.rating_out_of_5),
              aesthetics: generateSubRating(review.rating_out_of_5),
              challenge: generateSubRating(review.rating_out_of_5),
              value: generateSubRating(review.rating_out_of_5),
              amenities: generateSubRating(review.rating_out_of_5),
              walkability: generateSubRating(review.rating_out_of_5),
              service: generateSubRating(review.rating_out_of_5),
              reviewTitle: review.review_title,
              reviewText: review.review_text,
              isPublished: true,
              isSeed: true,
              seedSource,
              seedReviewerName: review.reviewer_name,
              createdAt,
              updatedAt: createdAt,
            },
          });

          entityCreated++;
          created++;
        } catch (err: any) {
          errors.push(`${entity.entity} / ${review.reviewer_name}: ${err.message}`);
        }
      }

      matchDetails.push({
        entity: entity.entity,
        dbMatch: course.courseName,
        reviewsCreated: entityCreated,
        reviewsSkipped: entitySkipped,
      });
    }

    return NextResponse.json({
      success: true,
      totalEntities: seedData.length,
      totalReviewsInData: seedData.reduce((sum, e) => sum + e.reviews.length, 0),
      created,
      skipped,
      noMatch,
      errors: errors.length > 0 ? errors : undefined,
      matchDetails,
    });
  } catch (err: any) {
    console.error("Seed reviews error:", err);
    return NextResponse.json(
      { error: "Failed to seed reviews", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove ALL seed reviews
 */
export async function DELETE(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const result = await prisma.userCourseRating.deleteMany({
      where: { isSeed: true },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (err: any) {
    console.error("Delete seed reviews error:", err);
    return NextResponse.json(
      { error: "Failed to delete seed reviews", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Seed review statistics
 */
export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const [totalSeedReviews, coursesWithSeeds, breakdown] = await Promise.all([
      prisma.userCourseRating.count({ where: { isSeed: true } }),
      prisma.userCourseRating.groupBy({
        by: ["courseId"],
        where: { isSeed: true },
        _count: { courseId: true },
      }),
      prisma.userCourseRating.findMany({
        where: { isSeed: true },
        select: {
          courseId: true,
          course: { select: { courseName: true } },
        },
      }),
    ]);

    // Build breakdown by course
    const courseBreakdown: Record<string, number> = {};
    for (const r of breakdown) {
      const name = r.course.courseName;
      courseBreakdown[name] = (courseBreakdown[name] || 0) + 1;
    }

    return NextResponse.json({
      totalSeedReviews,
      coursesWithSeedReviews: coursesWithSeeds.length,
      courseBreakdown,
    });
  } catch (err: any) {
    console.error("Seed review stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch seed review stats", details: err.message },
      { status: 500 }
    );
  }
}
