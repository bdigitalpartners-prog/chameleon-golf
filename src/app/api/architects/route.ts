import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const suggest = searchParams.get("suggest") === "true";
  const search = searchParams.get("search") || "";
  const era = searchParams.get("era") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (era) {
    where.era = era;
  }

  try {
    // Suggest mode: lightweight response for autocomplete
    if (suggest) {
      const architects = await prisma.architect.findMany({
        where,
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: Math.min(limit, 50),
      });

      // Get course counts using all three matching strategies
      const architectIds = architects.map((a) => a.id);
      const architectNames = architects.map((a) => a.name);

      // Also fetch aliases for these architects
      const aliases = await prisma.architectAlias.findMany({
        where: { architectId: { in: architectIds } },
        select: { architectId: true, aliasName: true },
      });
      const allNames = [
        ...architectNames,
        ...aliases.map((a) => a.aliasName),
      ];

      // Build alias lookup: aliasName -> architectId
      const aliasToArchitectId = new Map<string, number>();
      for (const a of architects) {
        aliasToArchitectId.set(a.name.toLowerCase(), a.id);
      }
      for (const al of aliases) {
        aliasToArchitectId.set(al.aliasName.toLowerCase(), al.architectId);
      }

      const [fkCourses, textCourses, junctionCourses] = await Promise.all([
        prisma.course.findMany({
          where: { architectId: { in: architectIds } },
          select: { courseId: true, architectId: true },
        }),
        prisma.course.findMany({
          where: { originalArchitect: { in: allNames, mode: "insensitive" } },
          select: { courseId: true, originalArchitect: true },
        }),
        prisma.courseArchitect.findMany({
          where: { architectId: { in: architectIds } },
          select: { courseId: true, architectId: true },
        }),
      ]);

      // Merge all course IDs per architect (deduplicating across strategies)
      const courseIdsByArchitect = new Map<number, Set<number>>();
      const ensureSet = (id: number) => {
        if (!courseIdsByArchitect.has(id)) courseIdsByArchitect.set(id, new Set());
        return courseIdsByArchitect.get(id)!;
      };

      for (const c of fkCourses) {
        if (c.architectId != null) ensureSet(c.architectId).add(c.courseId);
      }
      for (const c of textCourses) {
        const archId = aliasToArchitectId.get((c.originalArchitect || "").toLowerCase());
        if (archId != null) ensureSet(archId).add(c.courseId);
      }
      for (const c of junctionCourses) {
        ensureSet(c.architectId).add(c.courseId);
      }

      return NextResponse.json(
        architects.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          courseCount: courseIdsByArchitect.get(a.id)?.size || 0,
        }))
      );
    }

    const [architects, total] = await Promise.all([
      prisma.architect.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.architect.count({ where }),
    ]);

    // Get course counts using all three matching strategies (FK, text with aliases, junction)
    const architectIds = architects.map((a) => a.id);
    const architectNames = architects.map((a) => a.name);

    const aliases = await prisma.architectAlias.findMany({
      where: { architectId: { in: architectIds } },
      select: { architectId: true, aliasName: true },
    });
    const allNames = [
      ...architectNames,
      ...aliases.map((a) => a.aliasName),
    ];

    const aliasToArchitectId = new Map<string, number>();
    for (const a of architects) {
      aliasToArchitectId.set(a.name.toLowerCase(), a.id);
    }
    for (const al of aliases) {
      aliasToArchitectId.set(al.aliasName.toLowerCase(), al.architectId);
    }

    const [fkCourses, textCourses, junctionLinks] = await Promise.all([
      prisma.course.findMany({
        where: { architectId: { in: architectIds } },
        select: { courseId: true, architectId: true },
      }),
      prisma.course.findMany({
        where: { originalArchitect: { in: allNames, mode: "insensitive" } },
        select: { courseId: true, originalArchitect: true },
      }),
      prisma.courseArchitect.findMany({
        where: { architectId: { in: architectIds } },
        select: { courseId: true, architectId: true },
      }),
    ]);

    const courseIdsByArchitect = new Map<number, Set<number>>();
    const ensureSet = (id: number) => {
      if (!courseIdsByArchitect.has(id)) courseIdsByArchitect.set(id, new Set());
      return courseIdsByArchitect.get(id)!;
    };

    for (const c of fkCourses) {
      if (c.architectId != null) ensureSet(c.architectId).add(c.courseId);
    }
    for (const c of textCourses) {
      const archId = aliasToArchitectId.get((c.originalArchitect || "").toLowerCase());
      if (archId != null) ensureSet(archId).add(c.courseId);
    }
    for (const c of junctionLinks) {
      ensureSet(c.architectId).add(c.courseId);
    }

    const result = architects.map((a) => ({
      ...a,
      courseCount: courseIdsByArchitect.get(a.id)?.size || 0,
    }));

    return NextResponse.json({
      architects: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Architects list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch architects" },
      { status: 500 }
    );
  }
}
