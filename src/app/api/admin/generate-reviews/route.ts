import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

const SEED_USER_ID = "seed_user_golfeq_community";
const SEED_USER_EMAIL = "seed-reviews@golfeq.ai";
const SEED_USER_NAME = "GolfEQ Community";

interface GeneratedReview {
  authorName: string;
  authorHandicap: number;
  rating: number;
  reviewTitle: string;
  reviewText: string;
  playDate: string;
  conditioning: number;
  layoutDesign: number;
  paceOfPlay: number;
  aesthetics: number;
  challenge: number;
  value: number;
  amenities: number;
  walkability: number;
  service: number;
}

function buildReviewPrompt(
  courseName: string,
  city: string | null,
  state: string | null,
  accessType: string | null,
  description: string | null,
  par: number | null,
  numHoles: number | null
): string {
  const location = [city, state].filter(Boolean).join(", ");

  return `Generate realistic, diverse golf course reviews for "${courseName}" in ${location || "unknown location"}.
${accessType ? `Access: ${accessType}` : ""}
${description ? `About: ${description}` : ""}
${par ? `Par: ${par}` : ""}${numHoles ? `, Holes: ${numHoles}` : ""}

Generate 7 unique reviews from diverse golfers. Each review should:
- Be from a different perspective (handicap range: scratch to 25+)
- Reference specific holes, features, or experiences
- Vary in length (2-5 sentences for text)
- Include realistic play dates from the past 12 months (use YYYY-MM-DD format)
- Have honest, varied ratings (not all 5s — include some 3s and 4s)

Return a JSON array:
[{
  "authorName": "First L.",
  "authorHandicap": 12,
  "rating": 4.5,
  "reviewTitle": "Short compelling title",
  "reviewText": "Detailed review mentioning specific holes, conditions, experience...",
  "playDate": "2025-09-15",
  "conditioning": 4.5,
  "layoutDesign": 4.0,
  "paceOfPlay": 3.5,
  "aesthetics": 5.0,
  "challenge": 4.0,
  "value": 3.5,
  "amenities": 4.0,
  "walkability": 3.0,
  "service": 4.5
}]

All dimension ratings should be on a 1-5 scale (can use 0.5 increments).
Return ONLY valid JSON array, no markdown or explanation.`;
}

function parseReviewsResponse(raw: string): GeneratedReview[] {
  let cleaned = raw.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (r: any) =>
          typeof r.authorName === "string" &&
          typeof r.rating === "number" &&
          r.rating >= 1 &&
          r.rating <= 5
      )
      .map((r: any) => ({
        authorName: r.authorName,
        authorHandicap: typeof r.authorHandicap === "number" ? r.authorHandicap : 15,
        rating: Math.round(r.rating * 2) / 2,
        reviewTitle: typeof r.reviewTitle === "string" ? r.reviewTitle : "",
        reviewText: typeof r.reviewText === "string" ? r.reviewText : "",
        playDate: typeof r.playDate === "string" ? r.playDate : new Date().toISOString().split("T")[0],
        conditioning: clampRating(r.conditioning),
        layoutDesign: clampRating(r.layoutDesign),
        paceOfPlay: clampRating(r.paceOfPlay),
        aesthetics: clampRating(r.aesthetics),
        challenge: clampRating(r.challenge),
        value: clampRating(r.value),
        amenities: clampRating(r.amenities),
        walkability: clampRating(r.walkability),
        service: clampRating(r.service),
      }));
  } catch {
    return [];
  }
}

function clampRating(val: unknown): number {
  const num = typeof val === "number" ? val : 3.5;
  return Math.round(Math.max(1, Math.min(5, num)) * 2) / 2;
}

/**
 * POST /api/admin/generate-reviews
 * Body: { courseIds?: number[], limit?: number, overwrite?: boolean }
 * Generates seed reviews for top courses using AI
 */
export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: "PERPLEXITY_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { courseIds, limit = 10, overwrite = false } = body;

    // Ensure seed user exists
    const existingUser: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "users" WHERE "email" = $1 LIMIT 1`,
      SEED_USER_EMAIL
    );
    if (existingUser.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "users" ("id", "name", "email", "role", "is_active", "created_at", "updated_at")
         VALUES ($1, $2, $3, 'system', true, NOW(), NOW())`,
        SEED_USER_ID,
        SEED_USER_NAME,
        SEED_USER_EMAIL
      );
    }

    // Build query
    const where: any = {};
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      where.courseId = { in: courseIds.map(Number) };
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        courseId: true,
        courseName: true,
        accessType: true,
        city: true,
        state: true,
        description: true,
        par: true,
        numHoles: true,
        _count: {
          select: {
            ratings: { where: { isSeed: true, seedSource: { startsWith: "ai-generated" } } },
          },
        },
      },
      take: Math.min(limit, 50),
      orderBy: { numListsAppeared: "desc" },
    });

    // Filter out courses that already have AI-generated reviews (unless overwrite)
    const toProcess = overwrite
      ? courses
      : courses.filter((c) => c._count.ratings === 0);

    let totalCreated = 0;
    const errors: string[] = [];
    const results: { courseId: number; courseName: string; status: string; reviewsCreated: number }[] = [];

    for (const course of toProcess) {
      try {
        // If overwrite, don't delete real reviews — only delete AI-generated seeds
        if (overwrite) {
          await prisma.userCourseRating.deleteMany({
            where: {
              courseId: course.courseId,
              isSeed: true,
              seedSource: { startsWith: "ai-generated" },
            },
          });
        }

        const prompt = buildReviewPrompt(
          course.courseName,
          course.city,
          course.state,
          course.accessType,
          course.description,
          course.par,
          course.numHoles
        );

        const perplexityRes = await fetch(PERPLEXITY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!perplexityRes.ok) {
          const errText = await perplexityRes.text();
          errors.push(`${course.courseName}: API error ${perplexityRes.status}: ${errText.slice(0, 200)}`);
          results.push({ courseId: course.courseId, courseName: course.courseName, status: "error", reviewsCreated: 0 });
          continue;
        }

        const aiData = await perplexityRes.json();
        const rawContent = aiData.choices?.[0]?.message?.content;
        if (!rawContent) {
          errors.push(`${course.courseName}: Empty AI response`);
          results.push({ courseId: course.courseId, courseName: course.courseName, status: "error", reviewsCreated: 0 });
          continue;
        }

        const reviews = parseReviewsResponse(rawContent);
        if (reviews.length === 0) {
          errors.push(`${course.courseName}: Failed to parse reviews from AI`);
          results.push({ courseId: course.courseId, courseName: course.courseName, status: "error", reviewsCreated: 0 });
          continue;
        }

        let courseCreated = 0;
        for (const review of reviews) {
          // Check for duplicate by seedReviewerName
          const existing = await prisma.userCourseRating.findFirst({
            where: {
              courseId: course.courseId,
              seedReviewerName: review.authorName,
              isSeed: true,
            },
          });
          if (existing) continue;

          const playDate = new Date(review.playDate);
          const validDate = !isNaN(playDate.getTime()) ? playDate : new Date();

          await prisma.userCourseRating.create({
            data: {
              userId: SEED_USER_ID,
              courseId: course.courseId,
              overallRating: review.rating,
              conditioning: review.conditioning,
              layoutDesign: review.layoutDesign,
              paceOfPlay: review.paceOfPlay,
              aesthetics: review.aesthetics,
              challenge: review.challenge,
              value: review.value,
              amenities: review.amenities,
              walkability: review.walkability,
              service: review.service,
              handicapAtRating: review.authorHandicap,
              reviewTitle: review.reviewTitle,
              reviewText: review.reviewText,
              datePlayed: validDate,
              isPublished: true,
              isSeed: true,
              seedSource: "ai-generated",
              seedReviewerName: review.authorName,
              createdAt: validDate,
              updatedAt: validDate,
            },
          });
          courseCreated++;
        }

        totalCreated += courseCreated;
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          status: "success",
          reviewsCreated: courseCreated,
        });
      } catch (err: any) {
        errors.push(`${course.courseName}: ${err.message}`);
        results.push({ courseId: course.courseId, courseName: course.courseName, status: "error", reviewsCreated: 0 });
      }
    }

    return NextResponse.json({
      success: true,
      coursesProcessed: toProcess.length,
      totalReviewsCreated: totalCreated,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (err: any) {
    console.error("Generate reviews error:", err);
    return NextResponse.json(
      { error: "Failed to generate reviews", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/generate-reviews — Stats for AI-generated reviews
 */
export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const [totalAiReviews, coursesWithAiReviews] = await Promise.all([
      prisma.userCourseRating.count({
        where: { isSeed: true, seedSource: { startsWith: "ai-generated" } },
      }),
      prisma.userCourseRating.groupBy({
        by: ["courseId"],
        where: { isSeed: true, seedSource: { startsWith: "ai-generated" } },
        _count: { courseId: true },
      }),
    ]);

    return NextResponse.json({
      totalAiReviews,
      coursesWithAiReviews: coursesWithAiReviews.length,
      avgPerCourse: coursesWithAiReviews.length > 0
        ? Math.round(totalAiReviews / coursesWithAiReviews.length * 10) / 10
        : 0,
    });
  } catch (err: any) {
    console.error("Generate reviews stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: err.message },
      { status: 500 }
    );
  }
}
