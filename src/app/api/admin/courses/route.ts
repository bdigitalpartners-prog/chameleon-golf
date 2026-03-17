import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import { calculateEnrichmentPct } from "@/lib/course-enrichment";

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
          par: true,
          yearOpened: true,
          originalArchitect: true,
          courseStyle: true,
          greenFeeLow: true,
          greenFeeHigh: true,
          walkingPolicy: true,
          dressCode: true,
          caddieAvailability: true,
          practiceFacilities: true,
          bestTimeToPlay: true,
          bestMonths: true,
          golfSeason: true,
          fairwayGrass: true,
          greenGrass: true,
          websiteUrl: true,
          phone: true,
          latitude: true,
          streetAddress: true,
          chameleonScores: { select: { chameleonScore: true } },
        },
        orderBy: { courseName: "asc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.course.count({ where }),
    ]);

    const coursesWithEnrichment = courses.map((c) => {
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
        enrichmentPct: calculateEnrichmentPct(c as any),
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
