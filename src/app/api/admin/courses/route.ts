import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Fields that count toward enrichment
const ENRICHMENT_FIELDS = [
  "description", "tagline", "signatureHoleDescription", "insiderTips",
  "courseStrategy", "whatToExpect", "fairwayGrass", "greenGrass",
  "championshipHistory", "famousMoments", "websiteUrl", "phone",
];

function calcEnrichment(course: Record<string, unknown>): number {
  let filled = 0;
  for (const field of ENRICHMENT_FIELDS) {
    const val = course[field];
    if (val !== null && val !== undefined && val !== "" && val !== "[]" && val !== "{}") {
      filled++;
    }
  }
  return Math.round((filled / ENRICHMENT_FIELDS.length) * 100);
}

export async function GET(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const state = searchParams.get("state") || "";
  const accessType = searchParams.get("accessType") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");

  const where: Record<string, unknown> = {};
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
    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        orderBy: { courseName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          chameleonScores: true,
        },
      }),
    ]);

    return NextResponse.json({
      courses: courses.map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        city: c.city,
        state: c.state,
        accessType: c.accessType,
        courseType: c.courseType,
        chameleonScore: c.chameleonScores?.chameleonScore
          ? Number(c.chameleonScores.chameleonScore)
          : null,
        enrichmentPct: calcEnrichment(c as unknown as Record<string, unknown>),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Courses list API error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();

    const course = await prisma.course.create({
      data: body,
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("Course create error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
