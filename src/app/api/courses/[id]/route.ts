import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = parseInt(params.id);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Ensure course_media columns exist for Golf Digest image integration
    await prisma.$executeRawUnsafe(`ALTER TABLE course_media ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
    await prisma.$executeRawUnsafe(`ALTER TABLE course_media ADD COLUMN IF NOT EXISTS source_url VARCHAR(500)`);

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

    return NextResponse.json(course);
  } catch (error: any) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
