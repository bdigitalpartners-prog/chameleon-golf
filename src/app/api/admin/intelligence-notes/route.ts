import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import { generateNotesForCourse, type CourseForNotes } from "@/lib/intelligence-notes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/intelligence-notes
 *
 * Generate intelligence notes for courses.
 * Body: { courseIds?: number[], limit?: number, dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { courseIds, limit = 50, dryRun = false } = body;

    const where: any = {};
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      if (courseIds.length > 200) {
        return NextResponse.json({ error: "Max 200 courseIds per request" }, { status: 400 });
      }
      where.courseId = { in: courseIds.map(Number) };
    }

    const courses = await prisma.course.findMany({
      where,
      take: Math.min(limit, 200),
      orderBy: { numListsAppeared: "desc" },
      select: {
        courseId: true,
        courseName: true,
        description: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        par: true,
        yearOpened: true,
        originalArchitect: true,
        renovationArchitect: true,
        renovationYear: true,
        courseType: true,
        accessType: true,
        courseStyle: true,
        greenFeeLow: true,
        greenFeeHigh: true,
        walkingPolicy: true,
        dressCode: true,
        caddieAvailability: true,
        bestTimeToPlay: true,
        bestMonths: true,
        golfSeason: true,
        howToGetOn: true,
        courseStrategy: true,
        whatToExpect: true,
        insiderTips: true,
        numHoles: true,
        fairwayGrass: true,
        greenGrass: true,
        numListsAppeared: true,
        rankings: {
          select: {
            rankPosition: true,
            list: { select: { listName: true, source: { select: { sourceName: true } } } },
          },
        },
      },
    });

    let totalGenerated = 0;
    let totalSkipped = 0;
    const results: Array<{ courseId: number; courseName: string; notesGenerated: number }> = [];

    for (const course of courses) {
      const courseData: CourseForNotes = {
        ...course,
        latitude: course.latitude ? Number(course.latitude) : null,
        longitude: course.longitude ? Number(course.longitude) : null,
        greenFeeLow: course.greenFeeLow ? Number(course.greenFeeLow) : null,
        greenFeeHigh: course.greenFeeHigh ? Number(course.greenFeeHigh) : null,
        bestMonths: course.bestMonths as string[] | null,
        rankings: course.rankings.map((r) => ({
          rankPosition: r.rankPosition,
          rankingList: {
            listName: r.list.listName,
            publication: r.list.source?.sourceName || null,
          },
        })),
      };

      const notes = generateNotesForCourse(courseData);

      if (notes.length === 0) {
        totalSkipped++;
        continue;
      }

      if (!dryRun) {
        for (const note of notes) {
          await prisma.courseIntelligenceNote.upsert({
            where: {
              courseId_category: {
                courseId: course.courseId,
                category: note.category,
              },
            },
            create: {
              courseId: course.courseId,
              category: note.category,
              title: note.title,
              content: note.content,
              icon: note.icon,
            },
            update: {
              title: note.title,
              content: note.content,
              icon: note.icon,
              generatedAt: new Date(),
            },
          });
        }
      }

      totalGenerated += notes.length;
      results.push({
        courseId: course.courseId,
        courseName: course.courseName,
        notesGenerated: notes.length,
      });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      coursesProcessed: courses.length,
      coursesSkipped: totalSkipped,
      totalNotesGenerated: totalGenerated,
      results: results.slice(0, 50),
    });
  } catch (err: any) {
    console.error("Intelligence notes generation error:", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}

/**
 * GET /api/admin/intelligence-notes?courseId=123
 *
 * List intelligence notes, optionally filtered by courseId.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = (page - 1) * limit;

    const where: any = {};
    if (courseId) where.courseId = parseInt(courseId, 10);

    const [notes, total] = await Promise.all([
      prisma.courseIntelligenceNote.findMany({
        where,
        orderBy: [{ courseId: "asc" }, { category: "asc" }],
        skip: offset,
        take: limit,
        include: {
          course: { select: { courseName: true } },
        },
      }),
      prisma.courseIntelligenceNote.count({ where }),
    ]);

    return NextResponse.json({
      notes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("Intelligence notes list error:", err);
    return NextResponse.json({ error: err.message || "Fetch failed" }, { status: 500 });
  }
}
