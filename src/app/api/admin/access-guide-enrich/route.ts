import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

interface AccessGuideResult {
  guestPolicy: string | null;
  membershipInfo: string | null;
  reciprocalPrograms: { name: string; description: string }[];
  charitableEvents: { name: string; description: string; typicalCost: string }[];
  stayAndPlay: { resort: string; description: string; priceRange: string }[];
  otherPaths: { method: string; description: string }[];
  tips: string | null;
  difficultyRating: number;
}

function buildAccessGuidePrompt(
  courseName: string,
  accessType: string | null,
  city: string | null,
  state: string | null,
  existingInfo: Record<string, unknown>
): string {
  const location = [city, state].filter(Boolean).join(", ");
  const existing = Object.entries(existingInfo)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  return `Research how a member of the public can get access to play "${courseName}" in ${location || "unknown location"}.
Access type: ${accessType || "Unknown"}

${existing ? `We already know:\n${existing}\n` : ""}

Return a JSON object with these fields:
{
  "guestPolicy": "Detailed policy on how guests can play (member sponsorship required? How many guests per member? etc.)",
  "membershipInfo": "Overview of membership types, waitlist status, initiation fees if publicly known",
  "reciprocalPrograms": [{"name": "Program Name", "description": "Details about the reciprocal arrangement"}],
  "charitableEvents": [{"name": "Event Name", "description": "Description of charity tournament or outing", "typicalCost": "$500-$2000"}],
  "stayAndPlay": [{"resort": "Resort/Hotel Name", "description": "Package details", "priceRange": "$300-$500/night"}],
  "otherPaths": [{"method": "Method name", "description": "How to use this path to play the course"}],
  "tips": "Insider tips for getting on this course",
  "difficultyRating": 3
}

For difficultyRating, use 1-5 scale:
1 = "Walk-On Friendly" (public, easy to book)
2 = "Easy Access" (public/resort, just need a reservation)
3 = "Moderate" (semi-private, guest policy or resort stay needed)
4 = "Difficult" (private, need connections or special events)
5 = "Nearly Impossible" (ultra-exclusive private, extremely limited access)

Only include arrays that have real entries. If a course is public, focus on booking tips and best times.
Return ONLY valid JSON, no markdown or explanation.`;
}

function parseAIResponse(raw: string): AccessGuideResult | null {
  let cleaned = raw.trim();
  // Strip markdown code blocks
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Validate difficulty rating
    let difficulty = parseInt(parsed.difficultyRating);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) difficulty = 3;

    return {
      guestPolicy: typeof parsed.guestPolicy === "string" ? parsed.guestPolicy : null,
      membershipInfo: typeof parsed.membershipInfo === "string" ? parsed.membershipInfo : null,
      reciprocalPrograms: Array.isArray(parsed.reciprocalPrograms) ? parsed.reciprocalPrograms : [],
      charitableEvents: Array.isArray(parsed.charitableEvents) ? parsed.charitableEvents : [],
      stayAndPlay: Array.isArray(parsed.stayAndPlay) ? parsed.stayAndPlay : [],
      otherPaths: Array.isArray(parsed.otherPaths) ? parsed.otherPaths : [],
      tips: typeof parsed.tips === "string" ? parsed.tips : null,
      difficultyRating: difficulty,
    };
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/access-guide-enrich
 * Body: { courseIds?: number[], limit?: number, overwrite?: boolean }
 * Generates access guides for private/semi-private courses using AI
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

    // Build query filter
    const where: any = {};
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      where.courseId = { in: courseIds.map(Number) };
    }
    if (!overwrite) {
      where.accessGuide = null;
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        courseId: true,
        courseName: true,
        accessType: true,
        city: true,
        state: true,
        guestPolicy: true,
        howToGetOn: true,
        resortAffiliateAccess: true,
        stayAndPlayPackages: true,
        onSiteLodging: true,
        priceTier: true,
        accessGuide: { select: { id: true } },
      },
      take: Math.min(limit, 50),
      orderBy: { numListsAppeared: "desc" },
    });

    // Filter out courses that already have guides (unless overwrite)
    const toProcess = overwrite
      ? courses
      : courses.filter((c) => !c.accessGuide);

    let created = 0;
    let updated = 0;
    let errors: string[] = [];
    const results: { courseId: number; courseName: string; status: string; difficultyRating?: number }[] = [];

    for (const course of toProcess) {
      try {
        const existingInfo: Record<string, unknown> = {};
        if (course.guestPolicy) existingInfo.guestPolicy = course.guestPolicy;
        if (course.howToGetOn) existingInfo.howToGetOn = course.howToGetOn;
        if (course.resortAffiliateAccess) existingInfo.resortAffiliateAccess = course.resortAffiliateAccess;
        if (course.priceTier) existingInfo.priceTier = course.priceTier;
        if (course.onSiteLodging) existingInfo.onSiteLodging = course.onSiteLodging;

        const prompt = buildAccessGuidePrompt(
          course.courseName,
          course.accessType,
          course.city,
          course.state,
          existingInfo
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
          errors.push(`${course.courseName}: Perplexity API error ${perplexityRes.status}: ${errText.slice(0, 200)}`);
          results.push({ courseId: course.courseId, courseName: course.courseName, status: "error" });
          continue;
        }

        const aiData = await perplexityRes.json();
        const rawContent = aiData.choices?.[0]?.message?.content;
        if (!rawContent) {
          errors.push(`${course.courseName}: Empty AI response`);
          results.push({ courseId: course.courseId, courseName: course.courseName, status: "error" });
          continue;
        }

        const guideData = parseAIResponse(rawContent);
        if (!guideData) {
          errors.push(`${course.courseName}: Failed to parse AI response`);
          results.push({ courseId: course.courseId, courseName: course.courseName, status: "error" });
          continue;
        }

        const data = {
          accessType: course.accessType,
          guestPolicy: guideData.guestPolicy,
          membershipInfo: guideData.membershipInfo,
          reciprocalPrograms: guideData.reciprocalPrograms.length > 0 ? guideData.reciprocalPrograms : undefined,
          charitableEvents: guideData.charitableEvents.length > 0 ? guideData.charitableEvents : undefined,
          stayAndPlay: guideData.stayAndPlay.length > 0 ? guideData.stayAndPlay : undefined,
          otherPaths: guideData.otherPaths.length > 0 ? guideData.otherPaths : undefined,
          tips: guideData.tips,
          difficultyRating: guideData.difficultyRating,
          lastVerified: new Date(),
          updatedAt: new Date(),
        };

        if (course.accessGuide) {
          await prisma.courseAccessGuide.update({
            where: { courseId: course.courseId },
            data,
          });
          updated++;
          results.push({
            courseId: course.courseId,
            courseName: course.courseName,
            status: "updated",
            difficultyRating: guideData.difficultyRating,
          });
        } else {
          await prisma.courseAccessGuide.create({
            data: { courseId: course.courseId, ...data },
          });
          created++;
          results.push({
            courseId: course.courseId,
            courseName: course.courseName,
            status: "created",
            difficultyRating: guideData.difficultyRating,
          });
        }
      } catch (err: any) {
        errors.push(`${course.courseName}: ${err.message}`);
        results.push({ courseId: course.courseId, courseName: course.courseName, status: "error" });
      }
    }

    return NextResponse.json({
      success: true,
      processed: toProcess.length,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (err: any) {
    console.error("Access guide enrich error:", err);
    return NextResponse.json(
      { error: "Failed to generate access guides", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/access-guide-enrich — Stats
 */
export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const [totalGuides, totalCourses, byDifficulty] = await Promise.all([
      prisma.courseAccessGuide.count(),
      prisma.course.count(),
      prisma.courseAccessGuide.groupBy({
        by: ["difficultyRating"],
        _count: { id: true },
      }),
    ]);

    const difficultyBreakdown: Record<string, number> = {};
    const labels: Record<number, string> = {
      1: "Walk-On Friendly",
      2: "Easy Access",
      3: "Moderate",
      4: "Difficult",
      5: "Nearly Impossible",
    };
    for (const row of byDifficulty) {
      if (row.difficultyRating !== null) {
        difficultyBreakdown[labels[row.difficultyRating] || `Rating ${row.difficultyRating}`] = row._count.id;
      }
    }

    return NextResponse.json({
      totalGuides,
      totalCourses,
      coveragePct: totalCourses > 0 ? Math.round((totalGuides / totalCourses) * 100) : 0,
      difficultyBreakdown,
    });
  } catch (err: any) {
    console.error("Access guide stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: err.message },
      { status: 500 }
    );
  }
}
