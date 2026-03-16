import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
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
    const [architects, total] = await Promise.all([
      prisma.architect.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.architect.count({ where }),
    ]);

    // Get course counts for each architect by matching originalArchitect field
    const architectNames = architects.map((a) => a.name);
    const courseCounts = await prisma.course.groupBy({
      by: ["originalArchitect"],
      where: {
        originalArchitect: { in: architectNames },
      },
      _count: { courseId: true },
    });

    const courseCountMap = new Map(
      courseCounts.map((c) => [c.originalArchitect, c._count.courseId])
    );

    const result = architects.map((a) => ({
      ...a,
      courseCount: courseCountMap.get(a.name) || 0,
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
