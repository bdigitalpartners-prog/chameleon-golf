import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const state = searchParams.get("state") || "";
  const accessType = searchParams.get("accessType") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  const where: any = {};
  if (search) {
    where.courseName = { contains: search, mode: "insensitive" };
  }
  if (state) {
    where.state = state;
  }
  if (accessType) {
    where.accessType = accessType;
  }

  try {
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          accessType: true,
          courseType: true,
          description: true,
          insiderTips: true,
          nearbyDining: { select: { id: true } },
          nearbyLodging: { select: { id: true } },
          nearbyAttractions: { select: { id: true } },
          media: { select: { mediaId: true } },
          chameleonScores: { select: { chameleonScore: true } },
        },
        orderBy: { courseName: "asc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.course.count({ where }),
    ]);

    const enrichmentFields = [
      "description",
      "insiderTips",
    ] as const;

    const coursesWithEnrichment = courses.map((c) => {
      let filled = 0;
      const total = 6; // description, insiderTips, dining, lodging, attractions, media
      if (c.description) filled++;
      if (c.insiderTips) filled++;
      if (c.nearbyDining.length > 0) filled++;
      if (c.nearbyLodging.length > 0) filled++;
      if (c.nearbyAttractions.length > 0) filled++;
      if (c.media.length > 0) filled++;

      return {
        courseId: c.courseId,
        courseName: c.courseName,
        city: c.city,
        state: c.state,
        accessType: c.accessType,
        courseType: c.courseType,
        chameleonScore: c.chameleonScores
          ? Number(c.chameleonScores.chameleonScore)
          : null,
        enrichmentPct: Math.round((filled / total) * 100),
      };
    });

    return NextResponse.json({
      courses: coursesWithEnrichment,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Courses list error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { courseName, ...rest } = body;

    if (!courseName) {
      return NextResponse.json({ error: "courseName is required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { courseName, ...rest },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("Course create error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
