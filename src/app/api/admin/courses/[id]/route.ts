import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const courseId = parseInt(params.id);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        chameleonScores: true,
        media: { orderBy: { sortOrder: "asc" } },
        holes: { orderBy: { holeNumber: "asc" } },
        teeBoxes: true,
        nearbyDining: { orderBy: { sortOrder: "asc" } },
        nearbyLodging: { orderBy: { sortOrder: "asc" } },
        nearbyAttractions: true,
        rankings: {
          include: {
            list: { include: { source: true } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error("Course GET error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const courseId = parseInt(params.id);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Separate relation data from course fields
    const { dining, lodging, attractions, media, holes, teeBoxes, rankings, chameleonScores, ...courseData } = body;

    const course = await prisma.course.update({
      where: { courseId },
      data: courseData,
    });

    // Handle nearby dining updates
    if (dining !== undefined) {
      await prisma.courseNearbyDining.deleteMany({ where: { courseId } });
      if (dining.length > 0) {
        await prisma.courseNearbyDining.createMany({
          data: dining.map((d: Record<string, unknown>) => ({ ...d, courseId })),
        });
      }
    }

    // Handle nearby lodging updates
    if (lodging !== undefined) {
      await prisma.courseNearbyLodging.deleteMany({ where: { courseId } });
      if (lodging.length > 0) {
        await prisma.courseNearbyLodging.createMany({
          data: lodging.map((l: Record<string, unknown>) => ({ ...l, courseId })),
        });
      }
    }

    // Handle nearby attractions updates
    if (attractions !== undefined) {
      await prisma.courseNearbyAttractions.deleteMany({ where: { courseId } });
      if (attractions.length > 0) {
        await prisma.courseNearbyAttractions.createMany({
          data: attractions.map((a: Record<string, unknown>) => ({ ...a, courseId })),
        });
      }
    }

    return NextResponse.json(course);
  } catch (err) {
    console.error("Course PUT error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}
