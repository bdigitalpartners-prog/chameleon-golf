import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = parseInt(params.id);
    if (isNaN(courseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

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

    // Enrich ratings with seed review fields for frontend display
    const enrichedCourse = {
      ...course,
      ratings: course.ratings.map((r: any) => ({
        ...r,
        isSeed: r.isSeed || false,
        seedReviewerName: r.seedReviewerName || null,
        seedSource: r.seedSource || null,
      })),
    };

    return NextResponse.json(enrichedCourse);
  } catch (error: any) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
