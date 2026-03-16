import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const architect = await prisma.architect.findUnique({
      where: { slug: params.slug },
    });

    if (!architect) {
      return NextResponse.json(
        { error: "Architect not found" },
        { status: 404 }
      );
    }

    // Find courses by this architect
    const courses = await prisma.course.findMany({
      where: { originalArchitect: architect.name },
      select: {
        courseId: true,
        courseName: true,
        city: true,
        state: true,
        country: true,
        accessType: true,
        yearOpened: true,
        chameleonScores: { select: { chameleonScore: true } },
      },
      orderBy: { courseName: "asc" },
    });

    const serializedCourses = courses.map((c) => ({
      ...c,
      chameleonScore: c.chameleonScores
        ? Number(c.chameleonScores.chameleonScore)
        : null,
      chameleonScores: undefined,
    }));

    return NextResponse.json({
      ...architect,
      courses: serializedCourses,
    });
  } catch (err) {
    console.error("Architect detail error:", err);
    return NextResponse.json(
      { error: "Failed to fetch architect" },
      { status: 500 }
    );
  }
}
