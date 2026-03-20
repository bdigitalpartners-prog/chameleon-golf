import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = parseInt(params.id);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Ensure columns added after initial deployment exist
    await prisma.$executeRawUnsafe(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "architect_id" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "instagram_url" VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "twitter_url" VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "facebook_url" VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tiktok_url" VARCHAR(500)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "is_seed" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_source" VARCHAR(200)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "user_course_ratings" ADD COLUMN IF NOT EXISTS "seed_reviewer_name" VARCHAR(200)`);

    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        rankings: {
          include: { list: { include: { source: true } } },
          orderBy: { rankPosition: "asc" },
        },
        airports: {
          include: { airport: true },
          orderBy: { distanceMiles: "asc" },
          take: 10,
        },
        chameleonScores: true,
        nearbyDining: { orderBy: { sortOrder: "asc" } },
        nearbyLodging: { orderBy: { sortOrder: "asc" } },
        nearbyAttractions: { orderBy: { sortOrder: "asc" } },
        intelligenceNotes: {
          where: { isVisible: true },
          orderBy: { category: "asc" },
        },
        ratings: {
          where: { isPublished: true },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Safely enrich ratings with seed review fields
    const enrichedCourse = {
      ...course,
      ratings: (course.ratings || []).map((r: any) => ({
        ...r,
        isSeed: r.isSeed ?? false,
        seedReviewerName: r.seedReviewerName ?? null,
        seedSource: r.seedSource ?? null,
      })),
    };

    return NextResponse.json(enrichedCourse);
  } catch (error: any) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
