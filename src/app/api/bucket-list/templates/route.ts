import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Pre-built template lists — anyone can view
    const templates = [
      {
        id: "top-100",
        name: "The Ultimate Top 100",
        description: "All Golf Digest Top 100 courses in America",
        icon: "Trophy",
      },
      {
        id: "state-challenge",
        name: "State by State Challenge",
        description: "Best course in each state — 50 courses, 50 states",
        icon: "Map",
      },
      {
        id: "public-bucket-list",
        name: "Public Bucket List",
        description: "The best public-access courses in the country",
        icon: "Users",
      },
    ];

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[BucketList Templates GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { templateId } = await req.json();
    if (!templateId) {
      return NextResponse.json({ error: "templateId required" }, { status: 400 });
    }

    let courseIds: number[] = [];

    if (templateId === "top-100") {
      // Golf Digest Top 100
      const entries = await prisma.rankingEntry.findMany({
        where: {
          list: {
            source: { sourceName: { contains: "Golf Digest", mode: "insensitive" } },
            listName: { contains: "Top 100", mode: "insensitive" },
          },
        },
        select: { courseId: true },
        orderBy: { rankPosition: "asc" },
        take: 100,
      });
      courseIds = entries.map((e) => e.courseId);
    } else if (templateId === "state-challenge") {
      // Best course per state (top chameleon score per state)
      const results = await prisma.$queryRaw<{ course_id: number }[]>`
        SELECT DISTINCT ON (c.state) c.course_id
        FROM courses c
        JOIN chameleon_scores cs ON cs.course_id = c.course_id
        WHERE c.state IS NOT NULL AND c.country = 'United States'
        ORDER BY c.state, cs.chameleon_score DESC
      `;
      courseIds = results.map((r) => r.course_id);
    } else if (templateId === "public-bucket-list") {
      // Best public courses
      const entries = await prisma.course.findMany({
        where: {
          accessType: { in: ["Public", "public"] },
          chameleonScores: { isNot: null },
        },
        select: { courseId: true },
        orderBy: { chameleonScores: { chameleonScore: "desc" } },
        take: 50,
      });
      courseIds = entries.map((e) => e.courseId);
    } else {
      return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }

    if (courseIds.length === 0) {
      return NextResponse.json({ error: "No courses found for template" }, { status: 404 });
    }

    // Get existing items to avoid duplicates
    const existing = await prisma.bucketListItem.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: { courseId: true },
    });
    const existingIds = new Set(existing.map((e) => e.courseId));
    const newIds = courseIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await prisma.bucketListItem.createMany({
        data: newIds.map((courseId) => ({
          userId,
          courseId,
          priority: "Medium",
          status: "Want to Play",
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      added: newIds.length,
      skipped: existingIds.size,
      total: courseIds.length,
    });
  } catch (error) {
    console.error("[BucketList Templates POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
