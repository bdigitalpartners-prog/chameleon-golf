import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const courseId = parseInt(params.id, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        nearbyDining: { orderBy: { sortOrder: "asc" } },
        nearbyLodging: { orderBy: { sortOrder: "asc" } },
        nearbyAttractions: true,
        holes: { orderBy: { holeNumber: "asc" } },
        teeBoxes: true,
        chameleonScores: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error("Course detail error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const courseId = parseInt(params.id, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Remove relation fields that can't be directly updated
    const {
      media,
      nearbyDining,
      nearbyLodging,
      nearbyAttractions,
      holes,
      teeBoxes,
      chameleonScores,
      rankings,
      airports,
      ratings,
      scores,
      wishlists,
      nearbyCourses,
      nearbyFrom,
      courseId: _cid,
      createdAt,
      ...updateData
    } = body;

    const course = await prisma.course.update({
      where: { courseId },
      data: { ...updateData, updatedAt: new Date() },
    });

    return NextResponse.json(course);
  } catch (err) {
    console.error("Course update error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}
