import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Strip common suffixes for broader matching */
function normalizeName(name: string): string {
  return name
    .replace(/\s+(Golf\s+Club|Country\s+Club|Golf\s+Course|Golf\s+Links|Resort|&\s+Country\s+Club|CC|GC)$/i, "")
    .trim();
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { courseId, batchSize = 100 } = body;

    let courses: { courseId: number; courseName: string }[];

    if (courseId) {
      const c = await prisma.course.findUnique({
        where: { courseId },
        select: { courseId: true, courseName: true },
      });
      if (!c) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      courses = [c];
    } else {
      // Get courses with fewest content links
      courses = await prisma.course.findMany({
        select: {
          courseId: true,
          courseName: true,
          _count: { select: { externalContent: true } },
        },
        orderBy: { externalContent: { _count: "asc" } },
        take: batchSize,
      });
    }

    const results: { courseId: number; courseName: string; newLinks: number }[] = [];

    for (const course of courses) {
      const searchName = normalizeName(course.courseName);

      // Search external_content where title or summary contains the course name
      const matchingContent = await prisma.externalContent.findMany({
        where: {
          OR: [
            { title: { contains: searchName, mode: "insensitive" } },
            { summary: { contains: searchName, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });

      let newLinks = 0;
      for (const content of matchingContent) {
        const existing = await prisma.contentCourseLink.findFirst({
          where: { contentId: content.id, courseId: course.courseId },
        });
        if (!existing) {
          await prisma.contentCourseLink.create({
            data: {
              contentId: content.id,
              courseId: course.courseId,
              relevance: "auto-matched",
            },
          });
          newLinks++;
        }
      }

      results.push({ courseId: course.courseId, courseName: course.courseName, newLinks });
    }

    const totalNew = results.reduce((sum, r) => sum + r.newLinks, 0);

    return NextResponse.json({
      success: true,
      coursesProcessed: results.length,
      totalNewLinks: totalNew,
      results,
    });
  } catch (err: any) {
    console.error("Enrich course content error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
