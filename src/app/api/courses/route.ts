import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const access = searchParams.get("access");
    const style = searchParams.get("style");
    const sort = searchParams.get("sort") ?? "rankings";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "24"))
    );

    const where: any = {};
    if (search) {
      where.OR = [
        { courseName: { contains: search, mode: "insensitive" } },
        { facilityName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { originalArchitect: { contains: search, mode: "insensitive" } },
      ];
    }
    if (access) where.accessType = { equals: access, mode: "insensitive" };
    if (style) where.courseStyle = { contains: style, mode: "insensitive" };

    const orderBy: any[] = [];
    if (sort === "rankings") {
      orderBy.push({ rankings: { _count: "desc" } });
    } else if (sort === "best_rank") {
      orderBy.push({ rankings: { _count: "desc" } });
    } else if (sort === "year") {
      orderBy.push({ yearOpened: "desc" });
    } else {
      orderBy.push({ courseName: "asc" });
    }

    const [courses, total, stats] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: { where: { isPrimary: true }, take: 1 },
          rankings: {
            select: { rankPosition: true },
            orderBy: { rankPosition: "asc" },
          },
        },
      }),
      prisma.course.count({ where }),
      prisma.course.aggregate({
        _count: { courseId: true },
      }),
    ]);

    const statsData = {
      totalCourses: stats._count.courseId,
      totalRankings: await prisma.rankingEntry.count(),
      totalLists: await prisma.rankingList.count(),
      countries: await prisma.course
        .findMany({ distinct: ["country"], select: { country: true } })
        .then((r) => r.filter((c) => c.country).length),
    };

    const mapped = courses.map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      facilityName: c.facilityName,
      city: c.city,
      state: c.state,
      country: c.country,
      courseStyle: c.courseStyle,
      accessType: c.accessType,
      originalArchitect: c.originalArchitect,
      yearOpened: c.yearOpened,
      greenFeeLow: c.greenFeeLow?.toString() ?? null,
      primaryImageUrl: c.media[0]?.url ?? null,
      rankingCount: c.rankings.length,
      bestRank: c.rankings[0]?.rankPosition ?? null,
    }));

    return NextResponse.json({ courses: mapped, total, stats: statsData });
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
