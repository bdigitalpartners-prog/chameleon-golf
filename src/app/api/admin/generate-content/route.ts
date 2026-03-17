import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import {
  generateCourseContent,
  generateBatch,
  type CourseContext,
  type GeneratedContent,
} from "@/lib/ai-content-generation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function buildCourseContext(course: any): CourseContext {
  return {
    courseId: course.courseId,
    courseName: course.courseName,
    facilityName: course.facilityName,
    city: course.city,
    state: course.state,
    country: course.country,
    courseStyle: course.courseStyle,
    accessType: course.accessType,
    courseType: course.courseType,
    par: course.par,
    numHoles: course.numHoles,
    yearOpened: course.yearOpened,
    originalArchitect: course.originalArchitect,
    renovationArchitect: course.renovationArchitect,
    renovationYear: course.renovationYear,
    designPhilosophy: course.designPhilosophy,
    description: course.description,
    whatToExpect: course.whatToExpect,
    courseStrategy: course.courseStrategy,
    greenFeeLow: course.greenFeeLow?.toString(),
    greenFeeHigh: course.greenFeeHigh?.toString(),
    walkingPolicy: course.walkingPolicy,
    caddieAvailability: course.caddieAvailability,
    fairwayGrass: course.fairwayGrass,
    greenGrass: course.greenGrass,
    greenSpeed: course.greenSpeed,
    signatureHoleNumber: course.signatureHoleNumber,
    signatureHoleDescription: course.signatureHoleDescription,
    bestTimeToPlay: course.bestTimeToPlay,
    tagline: course.tagline,
    rankings: course.rankings?.map((r: any) => ({
      listName: r.list?.listName || "",
      sourceName: r.list?.source?.sourceName || "",
      rankPosition: r.rankPosition,
    })),
    architectName: course.architect?.name,
    architectBio: course.architect?.bio,
  };
}

async function saveContent(courseId: number, content: GeneratedContent, model: string) {
  await prisma.courseContent.upsert({
    where: { courseId },
    create: {
      courseId,
      richDescription: content.richDescription,
      whatToExpect: content.whatToExpect,
      strategyLowHcp: content.strategyLowHcp,
      strategyMidHcp: content.strategyMidHcp,
      strategyHighHcp: content.strategyHighHcp,
      threeThingsToKnow: content.threeThingsToKnow,
      firstTimerGuide: content.firstTimerGuide,
      modelUsed: model,
      generatedAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      richDescription: content.richDescription,
      whatToExpect: content.whatToExpect,
      strategyLowHcp: content.strategyLowHcp,
      strategyMidHcp: content.strategyMidHcp,
      strategyHighHcp: content.strategyHighHcp,
      threeThingsToKnow: content.threeThingsToKnow,
      firstTimerGuide: content.firstTimerGuide,
      modelUsed: model,
      updatedAt: new Date(),
    },
  });
}

/**
 * POST /api/admin/generate-content
 *
 * Body options:
 * - { courseId: number }                 — generate for a single course
 * - { batch: true, limit?: number }      — generate for top N courses by ranking
 * - { preview: true, courseId: number }   — preview without saving
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const model = body.model || "gpt-4o";

    // Single course generation
    if (body.courseId && !body.batch) {
      const course = await prisma.course.findUnique({
        where: { courseId: body.courseId },
        include: {
          rankings: {
            include: { list: { include: { source: true } } },
            orderBy: { rankPosition: "asc" },
            take: 5,
          },
          architect: { select: { name: true, bio: true } },
        },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const ctx = buildCourseContext(course);
      const content = await generateCourseContent(ctx, model);

      // Save unless preview-only
      if (!body.preview) {
        await saveContent(course.courseId, content, model);
      }

      return NextResponse.json({
        success: true,
        courseId: course.courseId,
        courseName: course.courseName,
        content,
        saved: !body.preview,
      });
    }

    // Batch generation
    if (body.batch) {
      const limit = Math.min(body.limit || 100, 200);

      // Get top courses by chameleon score that don't have content yet
      const courses = await prisma.course.findMany({
        where: {
          courseContent: null,
        },
        include: {
          chameleonScores: true,
          rankings: {
            include: { list: { include: { source: true } } },
            orderBy: { rankPosition: "asc" },
            take: 5,
          },
          architect: { select: { name: true, bio: true } },
        },
        orderBy: {
          chameleonScores: { chameleonScore: "desc" },
        },
        take: limit,
      });

      if (courses.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All courses already have generated content",
          generated: 0,
          failed: 0,
        });
      }

      const contexts = courses.map(buildCourseContext);
      const results = await generateBatch(contexts, {
        model,
        concurrency: 5,
        delayMs: 1000,
      });

      // Save successful results
      let saved = 0;
      let failed = 0;
      const errors: Array<{ courseId: number; error: string }> = [];

      for (const result of results) {
        if (result.content) {
          try {
            await saveContent(result.courseId, result.content, model);
            saved++;
          } catch (err: any) {
            failed++;
            errors.push({ courseId: result.courseId, error: err.message });
          }
        } else {
          failed++;
          if (result.error) {
            errors.push({ courseId: result.courseId, error: result.error });
          }
        }
      }

      return NextResponse.json({
        success: true,
        total: courses.length,
        generated: saved,
        failed,
        errors: errors.slice(0, 10),
      });
    }

    return NextResponse.json(
      { error: "Invalid request. Provide courseId or batch: true" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Content generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/generate-content?status=true
 *
 * Returns content generation status for all courses.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const filter = url.searchParams.get("filter") || "all"; // all, with_content, without_content

    const where: any = {};
    if (filter === "with_content") {
      where.courseContent = { isNot: null };
    } else if (filter === "without_content") {
      where.courseContent = null;
    }

    const [courses, total, withContent] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          courseId: true,
          courseName: true,
          city: true,
          state: true,
          country: true,
          accessType: true,
          courseContent: {
            select: {
              id: true,
              generatedAt: true,
              updatedAt: true,
              modelUsed: true,
              richDescription: true,
            },
          },
          chameleonScores: {
            select: { chameleonScore: true },
          },
        },
        orderBy: {
          chameleonScores: { chameleonScore: "desc" },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
      prisma.courseContent.count(),
    ]);

    const totalCourses = await prisma.course.count();

    return NextResponse.json({
      courses: courses.map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        location: [c.city, c.state].filter(Boolean).join(", "),
        accessType: c.accessType,
        chameleonScore: c.chameleonScores?.chameleonScore?.toString() || null,
        hasContent: !!c.courseContent,
        contentGeneratedAt: c.courseContent?.generatedAt || null,
        contentModel: c.courseContent?.modelUsed || null,
        contentPreview: c.courseContent?.richDescription
          ? c.courseContent.richDescription.substring(0, 150) + "..."
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalCourses,
        withContent,
        withoutContent: totalCourses - withContent,
        coveragePct: totalCourses > 0 ? Math.round((withContent / totalCourses) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error("Content status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
