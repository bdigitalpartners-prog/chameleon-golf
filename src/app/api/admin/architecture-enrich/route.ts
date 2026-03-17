import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RENOVATION_TYPES = [
  "Original Design",
  "Major Renovation",
  "Restoration",
  "Bunker Renovation",
  "Green Rebuild",
  "Routing Change",
];

const DESIGN_STYLES = [
  "Links",
  "Parkland",
  "Heathland",
  "Desert",
  "Mountain",
  "Coastal",
  "Prairie",
  "Woodland",
  "Tropical",
  "Clifftop",
];

const BUNKERING_STYLES = [
  "Geometric",
  "Naturalistic",
  "Flash-faced",
  "Revetted",
  "Minimalist",
  "Pot Bunkers",
  "Church Pew",
  "Waste Areas",
];

const TEMPLATE_NAMES = [
  "Redan",
  "Cape",
  "Biarritz",
  "Short",
  "Eden",
  "Alps",
  "Punchbowl",
  "Knoll",
  "Sahara",
  "Long",
  "Road Hole",
  "Double Plateau",
  "Dell",
  "Lido",
  "Bottle",
];

/**
 * POST /api/admin/architecture-enrich
 *
 * Uses OpenAI to research and populate architecture intelligence data for courses.
 * Body: { courseIds?: number[], limit?: number, topRankedFirst?: boolean }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { courseIds, limit = 10, topRankedFirst = true } = body;

    // Fetch courses to enrich
    let courses: any[];
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      if (courseIds.length > 50) {
        return NextResponse.json(
          { error: "Max 50 courseIds per request" },
          { status: 400 }
        );
      }
      courses = await prisma.course.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          architect: { select: { id: true, name: true } },
          designDna: true,
          renovations: true,
          templateHolesRel: true,
          chameleonScores: { select: { chameleonScore: true } },
        },
      });
    } else {
      // Get courses ordered by ranking presence (top-ranked first)
      const orderBy: any = topRankedFirst
        ? { numListsAppeared: "desc" }
        : { courseId: "asc" };

      courses = await prisma.course.findMany({
        where: {
          AND: [
            { designDna: null }, // Not yet enriched with design DNA
          ],
        },
        include: {
          architect: { select: { id: true, name: true } },
          designDna: true,
          renovations: true,
          templateHolesRel: true,
          chameleonScores: { select: { chameleonScore: true } },
        },
        orderBy,
        take: Math.min(limit, 50),
      });
    }

    if (courses.length === 0) {
      return NextResponse.json({
        message: "No courses to enrich",
        enriched: 0,
      });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const results: any[] = [];

    for (const course of courses) {
      try {
        const result = await enrichSingleCourse(course, OPENAI_API_KEY);
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          success: true,
          ...result,
        });
      } catch (err: any) {
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      enriched: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: courses.length,
      results,
    });
  } catch (err: any) {
    console.error("[architecture-enrich] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/architecture-enrich
 *
 * Returns statistics about architecture intelligence coverage.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const [totalCourses, withDesignDna, withRenovations, withTemplateHoles] =
      await Promise.all([
        prisma.course.count(),
        prisma.courseDesignDNA.count(),
        prisma.course.count({
          where: { renovations: { some: {} } },
        }),
        prisma.course.count({
          where: { templateHolesRel: { some: {} } },
        }),
      ]);

    const totalRenovations = await prisma.courseRenovation.count();
    const totalTemplateHoles = await prisma.templateHole.count();

    // Top courses without architecture data
    const unenrichedCourses = await prisma.course.findMany({
      where: { designDna: null },
      select: {
        courseId: true,
        courseName: true,
        numListsAppeared: true,
        originalArchitect: true,
      },
      orderBy: { numListsAppeared: "desc" },
      take: 20,
    });

    return NextResponse.json({
      stats: {
        totalCourses,
        withDesignDna,
        withRenovations,
        withTemplateHoles,
        totalRenovations,
        totalTemplateHoles,
        coveragePct: totalCourses > 0 ? Math.round((withDesignDna / totalCourses) * 100) : 0,
      },
      unenrichedCourses,
    });
  } catch (err: any) {
    console.error("[architecture-enrich] GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function enrichSingleCourse(course: any, apiKey: string) {
  const location = [course.city, course.state, course.country]
    .filter(Boolean)
    .join(", ");

  const prompt = `You are a golf course architecture expert. Analyze the following golf course and provide detailed architecture intelligence data.

Course: ${course.courseName}
Location: ${location}
Year Opened: ${course.yearOpened || "Unknown"}
Original Architect: ${course.originalArchitect || course.architect?.name || "Unknown"}
Course Style: ${course.courseStyle || "Unknown"}
Description: ${course.description || "None available"}
Renovation Notes: ${course.renovationNotes || "None"}
Renovation Architect: ${course.renovationArchitect || "None"}
Renovation Year: ${course.renovationYear || "None"}

Please return a JSON object with the following structure. Be accurate — if you don't have confident information, use null. For template holes, only include holes you can confidently identify as following classic template designs.

{
  "designDna": {
    "designStyle": "one of: ${DESIGN_STYLES.join(", ")}",
    "bunkeringStyle": "one of: ${BUNKERING_STYLES.join(", ")}",
    "greenComplexity": "integer 1-10",
    "greenSpeed": "description like 'Fast, typically 12+ on stimp' or null",
    "fairwayWidth": "one of: Narrow, Medium, Wide, Varied",
    "elevationChange": "one of: Flat, Gentle, Moderate, Dramatic",
    "waterFeatures": "one of: None, Minimal, Moderate, Significant",
    "treeDensity": "one of: Open, Scattered, Moderate, Dense",
    "windExposure": "one of: Sheltered, Moderate, Significant, Extreme",
    "walkability": "one of: Easy, Moderate, Challenging, Very Challenging",
    "constructionMethod": "e.g. Push-up greens, Sand-based USGA spec, etc. or null"
  },
  "renovations": [
    {
      "year": 2005,
      "type": "one of: ${RENOVATION_TYPES.join(", ")}",
      "architectName": "architect who did it or null",
      "description": "brief description",
      "scope": "what was changed",
      "source": "where this info comes from"
    }
  ],
  "templateHoles": [
    {
      "holeNumber": 4,
      "templateName": "one of: ${TEMPLATE_NAMES.join(", ")}",
      "description": "brief description of the hole",
      "originalInspiration": "where the template originated, e.g. 'Hole 15 at North Berwick'",
      "educationalNote": "why this design is significant in golf architecture"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting or explanation.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from OpenAI");

  // Parse JSON - strip markdown fences if present
  const jsonStr = content.replace(/^```json?\s*/, "").replace(/```\s*$/, "");
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse OpenAI response as JSON");
  }

  const savedData: any = { designDna: false, renovations: 0, templateHoles: 0 };

  // Save Design DNA
  if (parsed.designDna) {
    const dna = parsed.designDna;
    await prisma.courseDesignDNA.upsert({
      where: { courseId: course.courseId },
      create: {
        courseId: course.courseId,
        designStyle: validateEnum(dna.designStyle, DESIGN_STYLES),
        bunkeringStyle: validateEnum(dna.bunkeringStyle, BUNKERING_STYLES),
        greenComplexity: validateInt(dna.greenComplexity, 1, 10),
        greenSpeed: dna.greenSpeed || null,
        fairwayWidth: validateEnum(dna.fairwayWidth, ["Narrow", "Medium", "Wide", "Varied"]),
        elevationChange: validateEnum(dna.elevationChange, ["Flat", "Gentle", "Moderate", "Dramatic"]),
        waterFeatures: validateEnum(dna.waterFeatures, ["None", "Minimal", "Moderate", "Significant"]),
        treeDensity: validateEnum(dna.treeDensity, ["Open", "Scattered", "Moderate", "Dense"]),
        windExposure: validateEnum(dna.windExposure, ["Sheltered", "Moderate", "Significant", "Extreme"]),
        walkability: validateEnum(dna.walkability, ["Easy", "Moderate", "Challenging", "Very Challenging"]),
        constructionMethod: dna.constructionMethod || null,
      },
      update: {
        designStyle: validateEnum(dna.designStyle, DESIGN_STYLES),
        bunkeringStyle: validateEnum(dna.bunkeringStyle, BUNKERING_STYLES),
        greenComplexity: validateInt(dna.greenComplexity, 1, 10),
        greenSpeed: dna.greenSpeed || null,
        fairwayWidth: validateEnum(dna.fairwayWidth, ["Narrow", "Medium", "Wide", "Varied"]),
        elevationChange: validateEnum(dna.elevationChange, ["Flat", "Gentle", "Moderate", "Dramatic"]),
        waterFeatures: validateEnum(dna.waterFeatures, ["None", "Minimal", "Moderate", "Significant"]),
        treeDensity: validateEnum(dna.treeDensity, ["Open", "Scattered", "Moderate", "Dense"]),
        windExposure: validateEnum(dna.windExposure, ["Sheltered", "Moderate", "Significant", "Extreme"]),
        walkability: validateEnum(dna.walkability, ["Easy", "Moderate", "Challenging", "Very Challenging"]),
        constructionMethod: dna.constructionMethod || null,
        updatedAt: new Date(),
      },
    });
    savedData.designDna = true;
  }

  // Save Renovations
  if (Array.isArray(parsed.renovations) && parsed.renovations.length > 0) {
    for (const ren of parsed.renovations) {
      if (!ren.type) continue;
      const validType = validateEnum(ren.type, RENOVATION_TYPES);
      if (!validType) continue;

      // Look up architect if name provided
      let architectId: number | null = null;
      if (ren.architectName) {
        const arch = await prisma.architect.findFirst({
          where: {
            OR: [
              { name: { contains: ren.architectName, mode: "insensitive" } },
              { aliases: { some: { aliasName: { contains: ren.architectName, mode: "insensitive" } } } },
            ],
          },
          select: { id: true },
        });
        if (arch) architectId = arch.id;
      }

      await prisma.courseRenovation.create({
        data: {
          courseId: course.courseId,
          year: ren.year ? parseInt(String(ren.year)) : null,
          architectId,
          type: validType,
          description: ren.description || null,
          scope: ren.scope || null,
          source: ren.source || "AI-generated",
        },
      });
      savedData.renovations++;
    }
  }

  // Save Template Holes
  if (Array.isArray(parsed.templateHoles) && parsed.templateHoles.length > 0) {
    for (const hole of parsed.templateHoles) {
      if (!hole.holeNumber || !hole.templateName) continue;
      const holeNum = parseInt(String(hole.holeNumber));
      if (isNaN(holeNum) || holeNum < 1 || holeNum > 18) continue;

      await prisma.templateHole.upsert({
        where: {
          courseId_holeNumber: {
            courseId: course.courseId,
            holeNumber: holeNum,
          },
        },
        create: {
          courseId: course.courseId,
          holeNumber: holeNum,
          templateName: hole.templateName,
          description: hole.description || null,
          originalInspiration: hole.originalInspiration || null,
          educationalNote: hole.educationalNote || null,
        },
        update: {
          templateName: hole.templateName,
          description: hole.description || null,
          originalInspiration: hole.originalInspiration || null,
          educationalNote: hole.educationalNote || null,
        },
      });
      savedData.templateHoles++;
    }
  }

  return savedData;
}

function validateEnum(value: unknown, options: string[]): string | null {
  if (!value || typeof value !== "string") return null;
  const match = options.find(
    (o) => o.toLowerCase() === value.toLowerCase()
  );
  return match || null;
}

function validateInt(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined) return null;
  const num = parseInt(String(value));
  if (isNaN(num) || num < min || num > max) return null;
  return num;
}
