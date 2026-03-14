import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "24"), 2000);
    const skip = (page - 1) * limit;

    const country = url.searchParams.get("country") || undefined;
    const state = url.searchParams.get("state") || undefined;
    const courseStyle = url.searchParams.get("courseStyle") || undefined;
    const accessType = url.searchParams.get("accessType") || undefined;
    const feeMin = url.searchParams.get("feeMin") ? parseFloat(url.searchParams.get("feeMin")!) : undefined;
    const feeMax = url.searchParams.get("feeMax") ? parseFloat(url.searchParams.get("feeMax")!) : undefined;
    const sortBy = url.searchParams.get("sortBy") ?? "chameleon";
    const sortDir = url.searchParams.get("sortDir") ?? "desc";

    const where: any = {};
    if (country) where.country = country;
    if (state) where.state = state;
    if (courseStyle) where.courseStyle = courseStyle;
    if (accessType) where.accessType = accessType;
    if (feeMin !== undefined || feeMax !== undefined) {
      where.greenFeeLow = {};
      if (feeMin !== undefined) where.greenFeeLow.gte = feeMin;
      if (feeMax !== undefined) where.greenFeeLow.lte = feeMax;
    }

    const orderBy: any =
      sortBy === "name" ? { courseName: sortDir }
      : sortBy === "fee" ? { greenFeeLow: sortDir }
      : sortBy === "rank" ? { numListsAppeared: sortDir }
      : { numListsAppeared: "desc" };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          media: { where: { isPrimary: true }, take: 1 },
          chameleonScores: true,
          rankings: {
            include: { list: { include: { source: true } } },
            orderBy: { rankPosition: "asc" },
            take: 3, // top 3 rankings for list view
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const items = courses.map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      facilityName: c.facilityName,
      city: c.city,
      state: c.state,
      country: c.country,
      courseStyle: c.courseStyle,
      courseType: c.courseType,
      accessType: c.accessType,
      par: c.par,
      numHoles: c.numHoles,
      yearOpened: c.yearOpened,
      originalArchitect: c.originalArchitect,
      greenFeeLow: c.greenFeeLow?.toString() ?? null,
      greenFeeHigh: c.greenFeeHigh?.toString() ?? null,
      walkingPolicy: c.walkingPolicy,
      numListsAppeared: c.numListsAppeared,
      chameleonScore: c.chameleonScores?.chameleonScore?.toString() ?? null,
      prestigeScore: c.chameleonScores?.prestigeScore?.toString() ?? null,
      primaryImageUrl: c.media[0]?.url ?? null,
      bestRank: c.rankings[0]?.rankPosition ?? null,
      bestSource: c.rankings[0]?.list?.source?.sourceName ?? null,
      // All rankings for list view tooltip/detail
      rankings: c.rankings.map((r) => ({
        rank: r.rankPosition,
        list: r.list?.listName ?? "",
        source: r.list?.source?.sourceName ?? "",
      })),
    }));

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
