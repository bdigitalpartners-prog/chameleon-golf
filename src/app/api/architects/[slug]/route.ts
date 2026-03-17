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

    // Build name variants: architect.name + all aliases
    const aliases = await prisma.architectAlias.findMany({
      where: { architectId: architect.id },
      select: { aliasName: true },
    });
    const nameVariants = [architect.name, ...aliases.map((a) => a.aliasName)];

    const courseSelect = {
      courseId: true,
      courseName: true,
      city: true,
      state: true,
      country: true,
      accessType: true,
      yearOpened: true,
      chameleonScores: { select: { chameleonScore: true } },
    } as const;

    // Find courses via FK, text match (case-insensitive with aliases), and junction table
    const [fkCourses, textCourses, junctionCourses] = await Promise.all([
      prisma.course.findMany({
        where: { architectId: architect.id },
        select: courseSelect,
        orderBy: { courseName: "asc" },
      }),
      prisma.course.findMany({
        where: {
          OR: nameVariants.map((name) => ({
            originalArchitect: { equals: name, mode: "insensitive" as const },
          })),
        },
        select: courseSelect,
        orderBy: { courseName: "asc" },
      }),
      prisma.course.findMany({
        where: {
          courseArchitects: { some: { architectId: architect.id } },
        },
        select: courseSelect,
        orderBy: { courseName: "asc" },
      }),
    ]);

    // Deduplicate
    const seen = new Set<number>();
    const courses = [...fkCourses, ...textCourses, ...junctionCourses].filter((c) => {
      if (seen.has(c.courseId)) return false;
      seen.add(c.courseId);
      return true;
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
