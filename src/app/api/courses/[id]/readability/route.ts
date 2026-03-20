import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

/* ── Ensure table exists ── */

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS course_readability (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
      handicap_band VARCHAR(20) NOT NULL,
      hole_advice JSONB NOT NULL DEFAULT '[]',
      overall_strategy TEXT,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(course_id, handicap_band)
    )
  `);
}

/* ── Handicap band mapping ── */

function getHandicapBand(handicap: number): string {
  if (handicap <= 2) return "scratch";
  if (handicap <= 9) return "low";
  if (handicap <= 18) return "mid";
  if (handicap <= 28) return "high";
  return "beginner";
}

function getHandicapLabel(band: string): string {
  switch (band) {
    case "scratch": return "scratch to +2 (0-2 handicap)";
    case "low": return "low handicap (3-9)";
    case "mid": return "mid handicap (10-18)";
    case "high": return "high handicap (19-28)";
    case "beginner": return "beginner/high handicap (29+)";
    default: return band;
  }
}

/* ── Build prompt for Perplexity ── */

function buildReadabilityPrompt(
  courseName: string,
  city: string | null,
  state: string | null,
  country: string,
  par: number | null,
  numHoles: number,
  handicapLabel: string,
  holes: Array<{ holeNumber: number; par: number; yardage?: number }>,
  teeBoxes: Array<{ teeName: string; courseRating?: number; slopeRating?: number; totalYardage?: number }>,
  courseStyle: string | null,
  designPhilosophy: string | null,
  fairwayGrass: string | null,
  greenGrass: string | null,
  greenSpeed: string | null,
): string {
  const location = [city, state, country].filter(Boolean).join(", ");

  let holeList = "";
  if (holes.length > 0) {
    holeList = "\n\nKnown hole data:\n" + holes
      .sort((a, b) => a.holeNumber - b.holeNumber)
      .map(h => `Hole ${h.holeNumber}: Par ${h.par}${h.yardage ? `, ${h.yardage} yards` : ""}`)
      .join("\n");
  }

  let teeInfo = "";
  if (teeBoxes.length > 0) {
    teeInfo = "\n\nTee boxes:\n" + teeBoxes
      .map(t => `${t.teeName}: ${t.totalYardage ? t.totalYardage + " yards" : ""}${t.courseRating ? `, CR ${t.courseRating}` : ""}${t.slopeRating ? `, Slope ${t.slopeRating}` : ""}`)
      .join("\n");
  }

  let courseDetails = "";
  if (courseStyle) courseDetails += `\nCourse style: ${courseStyle}`;
  if (designPhilosophy) courseDetails += `\nDesign philosophy: ${designPhilosophy}`;
  if (fairwayGrass) courseDetails += `\nFairway grass: ${fairwayGrass}`;
  if (greenGrass) courseDetails += `\nGreen grass: ${greenGrass}`;
  if (greenSpeed) courseDetails += `\nGreen speed: ${greenSpeed}`;

  return `You are an expert golf course caddie and course strategy advisor. Provide a detailed hole-by-hole readability analysis and playing strategy for the following course, tailored specifically for a ${handicapLabel} golfer.

Course: ${courseName}
Location: ${location}
Par: ${par || "unknown"}
Holes: ${numHoles}${courseDetails}${teeInfo}${holeList}

For EACH hole (1 through ${numHoles}), provide:
1. The hole's par and approximate yardage (use the data provided or your knowledge)
2. The key challenge of the hole (e.g., water hazard left, elevated green, dogleg right, bunker placement)
3. Specific playing strategy for a ${handicapLabel} golfer — where to aim off the tee, approach strategy, club selection advice
4. A recommended play call: one concise phrase like "Favor the right side", "Lay up short of the creek", "Take one more club", "Play for the center of the green"

Also provide an overall course strategy summary for this handicap level — what to watch for, which holes are scoring opportunities, which are survival holes, and any general tips for reading this course.

Return your response as valid JSON with this exact structure:
{
  "overallStrategy": "string with 3-5 sentences of overall strategy",
  "holes": [
    {
      "holeNumber": 1,
      "par": 4,
      "yardage": 425,
      "keyChallenge": "string describing the main challenge",
      "advice": "string with 2-3 sentences of specific playing strategy",
      "recommendedPlay": "short phrase — the key takeaway"
    }
  ]
}

Return ONLY the JSON, no markdown code fences, no preamble.`;
}

/* ── GET handler ── */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "AI service is not configured" },
      { status: 503 }
    );
  }

  const courseId = parseInt(params.id, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  const handicapParam = request.nextUrl.searchParams.get("handicap");
  if (!handicapParam) {
    return NextResponse.json({ error: "handicap parameter required" }, { status: 400 });
  }

  const handicap = parseFloat(handicapParam);
  if (isNaN(handicap) || handicap < -5 || handicap > 54) {
    return NextResponse.json({ error: "Invalid handicap value" }, { status: 400 });
  }

  const band = getHandicapBand(handicap);
  const handicapLabel = getHandicapLabel(band);

  try {
    // Ensure table exists (no-op if already there)
    await ensureTable();

    // Check cache first (raw SQL to avoid Prisma schema mismatch)
    const cached = await prisma.$queryRaw<Array<{
      id: string;
      course_id: number;
      handicap_band: string;
      hole_advice: any;
      overall_strategy: string | null;
      generated_at: Date;
    }>>`
      SELECT id, course_id, handicap_band, hole_advice, overall_strategy, generated_at
      FROM course_readability
      WHERE course_id = ${courseId} AND handicap_band = ${band}
      LIMIT 1
    `;

    if (cached.length > 0) {
      const entry = cached[0];
      const ageMs = Date.now() - new Date(entry.generated_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (ageMs < thirtyDays) {
        return NextResponse.json({
          courseId,
          handicapBand: band,
          handicapLabel,
          overallStrategy: entry.overall_strategy,
          holes: entry.hole_advice,
          cached: true,
          generatedAt: entry.generated_at,
        });
      }
    }

    // Fetch course data (Course model works fine with Prisma)
    const course = await prisma.course.findUnique({
      where: { courseId },
      select: {
        courseId: true,
        courseName: true,
        city: true,
        state: true,
        country: true,
        par: true,
        numHoles: true,
        courseStyle: true,
        designPhilosophy: true,
        fairwayGrass: true,
        greenGrass: true,
        greenSpeed: true,
        holes: {
          select: { holeNumber: true, par: true, teeYardages: { select: { yardage: true, tee: { select: { teeName: true } } } } },
          orderBy: { holeNumber: "asc" },
        },
        teeBoxes: {
          select: { teeName: true, courseRating: true, slopeRating: true, totalYardage: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const numHoles = course.numHoles || 18;

    // Flatten hole data — pick longest tee yardage for reference
    const holes = course.holes.map((h) => ({
      holeNumber: h.holeNumber,
      par: h.par,
      yardage: h.teeYardages.length > 0
        ? Math.max(...h.teeYardages.map(ty => ty.yardage))
        : undefined,
    }));

    const teeBoxes = course.teeBoxes.map(t => ({
      teeName: t.teeName,
      courseRating: t.courseRating ? Number(t.courseRating) : undefined,
      slopeRating: t.slopeRating ?? undefined,
      totalYardage: t.totalYardage ?? undefined,
    }));

    const prompt = buildReadabilityPrompt(
      course.courseName,
      course.city,
      course.state,
      course.country,
      course.par,
      numHoles,
      handicapLabel,
      holes,
      teeBoxes,
      course.courseStyle,
      course.designPhilosophy,
      course.fairwayGrass,
      course.greenGrass,
      course.greenSpeed,
    );

    // Call Perplexity Sonar (standard, non-streaming)
    const response = await fetch(PERPLEXITY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are an expert golf course strategist. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate readability analysis" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response — strip any markdown code fences if present
    let parsed: { overallStrategy: string; holes: any[] };
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Perplexity response as JSON:", content.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid response, please try again" },
        { status: 502 }
      );
    }

    // Validate structure
    if (!parsed.holes || !Array.isArray(parsed.holes)) {
      return NextResponse.json(
        { error: "AI returned unexpected structure, please try again" },
        { status: 502 }
      );
    }

    const holeAdviceJson = JSON.stringify(parsed.holes);
    const overallStrategy = parsed.overallStrategy || null;

    // Upsert cache (raw SQL)
    if (cached.length > 0) {
      await prisma.$executeRaw`
        UPDATE course_readability
        SET hole_advice = ${holeAdviceJson}::jsonb,
            overall_strategy = ${overallStrategy},
            generated_at = NOW()
        WHERE course_id = ${courseId} AND handicap_band = ${band}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO course_readability (id, course_id, handicap_band, hole_advice, overall_strategy, generated_at)
        VALUES (gen_random_uuid()::text, ${courseId}, ${band}, ${holeAdviceJson}::jsonb, ${overallStrategy}, NOW())
        ON CONFLICT (course_id, handicap_band)
        DO UPDATE SET hole_advice = EXCLUDED.hole_advice, overall_strategy = EXCLUDED.overall_strategy, generated_at = NOW()
      `;
    }

    return NextResponse.json({
      courseId,
      handicapBand: band,
      handicapLabel,
      overallStrategy: parsed.overallStrategy,
      holes: parsed.holes,
      cached: false,
      generatedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("Readability analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
