import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const listId = parseInt(params.listId);
    if (isNaN(listId)) {
      return NextResponse.json({ error: "Invalid list ID" }, { status: 400 });
    }

    const list = await prisma.rankingList.findUnique({
      where: { listId },
      include: {
        source: true,
        entries: {
          orderBy: { rankPosition: "asc" },
          include: {
            course: {
              include: {
                media: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const courses = list.entries.map((e) => ({
      entryId: e.entryId,
      rankPosition: e.rankPosition,
      rankTied: e.rankTied,
      previousRank: e.previousRank,
      rankChange: e.rankChange,
      courseId: e.course.courseId,
      courseName: e.course.courseName,
      facilityName: e.course.facilityName,
      city: e.course.city,
      state: e.course.state,
      country: e.course.country,
      courseStyle: e.course.courseStyle,
      accessType: e.course.accessType,
      originalArchitect: e.course.originalArchitect,
      yearOpened: e.course.yearOpened,
      greenFeeLow: e.course.greenFeeLow?.toString() ?? null,
      primaryImageUrl: e.course.media[0]?.url ?? null,
    }));

    return NextResponse.json({
      listId: list.listId,
      listName: list.listName,
      listType: list.listType,
      region: list.region,
      yearPublished: list.yearPublished,
      prestigeTier: list.prestigeTier,
      url: list.url,
      source: {
        sourceId: list.source.sourceId,
        sourceName: list.source.sourceName,
        sourceUrl: list.source.sourceUrl,
      },
      totalCourses: courses.length,
      courses,
    });
  } catch (error: any) {
    console.error("GET /api/rankings/[listId] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
