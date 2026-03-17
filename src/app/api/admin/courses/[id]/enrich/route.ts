import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import {
  enrichCourse,
  calculateEnrichmentPct,
  ENRICHMENT_FIELDS,
  type CourseData,
} from "@/lib/course-enrichment";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

// Fields the AI can research and fill
const AI_ENRICHABLE_FIELDS = [
  "description",
  "originalArchitect",
  "yearOpened",
  "par",
  "numHoles",
  "courseStyle",
  "accessType",
  "courseType",
  "greenFeeLow",
  "greenFeeHigh",
  "greenFeeCurrency",
  "walkingPolicy",
  "dressCode",
  "caddieAvailability",
  "websiteUrl",
  "phone",
  "streetAddress",
  "city",
  "state",
  "zipCode",
  "latitude",
  "longitude",
  "fairwayGrass",
  "greenGrass",
  "renovationArchitect",
  "renovationYear",
  "designPhilosophy",
  "whatToExpect",
  "courseStrategy",
  "tagline",
] as const;

interface EnrichmentContext {
  courseName: string;
  country: string;
  existingFields: Record<string, any>;
  missingFields: string[];
}

function buildPrompt(ctx: EnrichmentContext): string {
  const existingInfo = Object.entries(ctx.existingFields)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  const missingList = ctx.missingFields.join(", ");

  return `Research the golf course "${ctx.courseName}" in ${ctx.country || "unknown location"}.

${existingInfo ? `We already know:\n${existingInfo}\n` : ""}
We are MISSING the following fields and need you to find accurate data for as many as possible: ${missingList}

Return a JSON object with ONLY the fields you can confidently fill in. Use these exact field names and formats:
{
  "description": "2-4 sentence overview of the course — its character, history, and what makes it notable",
  "originalArchitect": "Name of the original course designer/architect",
  "yearOpened": 1920,
  "par": 72,
  "numHoles": 18,
  "courseStyle": "Links | Parkland | Desert | Mountain | Heathland | Coastal | Tropical | Prairie | Woodland",
  "accessType": "Private | Public | Resort | Semi-Private | Municipal",
  "courseType": "Championship | Executive | Regulation | Resort Course | 9-Hole",
  "greenFeeLow": 75,
  "greenFeeHigh": 250,
  "greenFeeCurrency": "USD",
  "walkingPolicy": "Walking Only | Walking Allowed | Walking at Certain Times | Cart Required | Unrestricted",
  "dressCode": "description of dress code policy",
  "caddieAvailability": "Required | Available | Not Available",
  "websiteUrl": "https://...",
  "phone": "+1-555-123-4567",
  "streetAddress": "123 Golf Club Road",
  "city": "City Name",
  "state": "State or Province",
  "zipCode": "12345",
  "latitude": 40.1234567,
  "longitude": -74.1234567,
  "fairwayGrass": "Bentgrass | Bermuda | Zoysia | Fescue | Paspalum | Kikuyu | Poa annua",
  "greenGrass": "Bentgrass | Bermuda | Poa annua | TifEagle | MiniVerde | Champion Bermuda",
  "renovationArchitect": "Name if course was renovated",
  "renovationYear": 2015,
  "designPhilosophy": "Brief description of the architectural philosophy",
  "whatToExpect": "What a golfer should expect when playing this course",
  "courseStrategy": "Brief strategic tips for playing the course",
  "tagline": "A short, compelling tagline for the course (under 15 words)"
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- Only include fields you are confident about — do not guess
- For greenFeeLow/greenFeeHigh, use numeric values in the local currency
- For latitude/longitude, use decimal degrees with 7 decimal places
- For description, write 2-4 engaging sentences that capture the essence of the course
- Do NOT include fields that already have data`;
}

function parseAIResponse(rawContent: string): Record<string, any> {
  // Strip markdown code blocks if present
  let cleaned = rawContent.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // Try to extract JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in AI response");

  return JSON.parse(match[0]);
}

function validateAndClean(
  fields: Record<string, any>,
  missingFields: string[]
): Record<string, any> {
  const clean: Record<string, any> = {};
  const missingSet = new Set(missingFields);

  for (const [key, value] of Object.entries(fields)) {
    // Only accept fields we know about and that were missing
    if (!missingSet.has(key)) continue;
    if (value === null || value === undefined || value === "") continue;

    switch (key) {
      case "par":
        if (typeof value === "number" && value >= 27 && value <= 73) clean.par = value;
        break;
      case "numHoles":
        if (typeof value === "number" && [9, 18, 27, 36].includes(value)) clean.numHoles = value;
        break;
      case "yearOpened":
      case "renovationYear":
        if (typeof value === "number" && value >= 1800 && value <= 2026) clean[key] = value;
        break;
      case "greenFeeLow":
      case "greenFeeHigh":
        if (typeof value === "number" && value >= 0 && value <= 10000) clean[key] = value;
        break;
      case "latitude":
        if (typeof value === "number" && value >= -90 && value <= 90) clean.latitude = value;
        break;
      case "longitude":
        if (typeof value === "number" && value >= -180 && value <= 180) clean.longitude = value;
        break;
      case "courseStyle":
        {
          const validStyles = ["Links", "Parkland", "Desert", "Mountain", "Heathland", "Coastal", "Links-Parkland", "Tropical", "Prairie", "Woodland"];
          if (validStyles.includes(value)) clean.courseStyle = value;
        }
        break;
      case "accessType":
        {
          const validAccess = ["Private", "Public", "Resort", "Semi-Private", "Municipal"];
          if (validAccess.includes(value)) clean.accessType = value;
        }
        break;
      case "courseType":
        {
          const validTypes = ["Championship", "Executive", "Regulation", "Resort Course", "9-Hole"];
          if (validTypes.includes(value)) clean.courseType = value;
        }
        break;
      case "walkingPolicy":
        {
          const validPolicies = ["Walking Only", "Walking Allowed", "Walking at Certain Times", "Cart Required", "Unrestricted"];
          if (validPolicies.includes(value)) clean.walkingPolicy = value;
        }
        break;
      case "caddieAvailability":
        {
          const validCaddie = ["Required", "Available", "Not Available"];
          if (validCaddie.includes(value)) clean.caddieAvailability = value;
        }
        break;
      case "description":
      case "originalArchitect":
      case "dressCode":
      case "websiteUrl":
      case "phone":
      case "streetAddress":
      case "city":
      case "state":
      case "zipCode":
      case "greenFeeCurrency":
      case "fairwayGrass":
      case "greenGrass":
      case "renovationArchitect":
      case "designPhilosophy":
      case "whatToExpect":
      case "courseStrategy":
      case "tagline":
        if (typeof value === "string" && value.trim().length > 0) clean[key] = value.trim();
        break;
    }
  }

  return clean;
}

/**
 * POST /api/admin/courses/[id]/enrich
 *
 * AI-powered enrichment for a single course using Perplexity Sonar API.
 * Researches the course online and fills missing fields.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "Perplexity API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch the full course record
    const course = await prisma.course.findUnique({
      where: { courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Determine which fields are missing
    const existingFields: Record<string, any> = {};
    const missingFields: string[] = [];

    for (const field of AI_ENRICHABLE_FIELDS) {
      const val = (course as any)[field];
      if (val !== null && val !== undefined && val !== "") {
        existingFields[field] = val;
      } else {
        missingFields.push(field);
      }
    }

    // Also run rule-based enrichment first
    const courseData: CourseData = {
      courseId: course.courseId,
      courseName: course.courseName,
      description: course.description,
      state: course.state,
      country: course.country,
      latitude: course.latitude ? Number(course.latitude) : null,
      longitude: course.longitude ? Number(course.longitude) : null,
      par: course.par,
      yearOpened: course.yearOpened,
      originalArchitect: course.originalArchitect,
      courseType: course.courseType,
      accessType: course.accessType,
      courseStyle: course.courseStyle,
      greenFeeLow: course.greenFeeLow ? Number(course.greenFeeLow) : null,
      greenFeeHigh: course.greenFeeHigh ? Number(course.greenFeeHigh) : null,
      walkingPolicy: course.walkingPolicy,
      dressCode: course.dressCode,
      caddieAvailability: course.caddieAvailability,
      practiceFacilities: course.practiceFacilities,
      bestTimeToPlay: course.bestTimeToPlay,
      bestMonths: course.bestMonths,
      averageRoundTime: course.averageRoundTime,
      golfSeason: course.golfSeason,
      numHoles: course.numHoles,
      fairwayGrass: course.fairwayGrass,
      greenGrass: course.greenGrass,
    };

    const beforePct = calculateEnrichmentPct(course as any);

    // Step 1: Run rule-based enrichment
    const ruleResult = enrichCourse(courseData);
    const ruleFields = ruleResult.fields;

    // Merge rule-based results into existing fields for the AI prompt
    const mergedExisting = { ...existingFields, ...ruleFields };

    // Recalculate missing fields after rule-based enrichment
    const stillMissing = missingFields.filter(
      (f) => !(f in ruleFields)
    );

    let aiFields: Record<string, any> = {};
    let aiError: string | null = null;

    // Step 2: If there are still missing fields, use Perplexity AI
    if (stillMissing.length > 0) {
      const prompt = buildPrompt({
        courseName: course.courseName,
        country: course.country,
        existingFields: mergedExisting,
        missingFields: stillMissing,
      });

      try {
        const perplexityRes = await fetch(PERPLEXITY_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              {
                role: "system",
                content:
                  "You are a golf course research assistant. Find accurate, factual information about golf courses. Return only valid JSON with the requested data fields. Do not make up information — only include data you can verify.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        });

        if (!perplexityRes.ok) {
          const errText = await perplexityRes.text();
          console.error("Perplexity API error:", errText);
          aiError = "Perplexity API returned an error — rule-based enrichment was still applied";
        } else {
          const data = await perplexityRes.json();
          const rawContent = data.choices?.[0]?.message?.content || "";
          const parsed = parseAIResponse(rawContent);
          aiFields = validateAndClean(parsed, stillMissing);
        }
      } catch (err: any) {
        console.error("Perplexity enrichment error:", err);
        aiError = `AI enrichment failed: ${err.message} — rule-based enrichment was still applied`;
      }
    }

    // Merge all enrichment: rule-based + AI
    const allNewFields = { ...ruleFields, ...aiFields };
    const totalFieldsEnriched = Object.keys(allNewFields).length;

    if (totalFieldsEnriched === 0) {
      return NextResponse.json({
        success: true,
        courseId,
        courseName: course.courseName,
        beforePct,
        afterPct: beforePct,
        fieldsEnriched: 0,
        ruleBasedFields: [],
        aiFields: [],
        message: "No additional data could be found for this course",
        aiError,
      });
    }

    // Save to database
    await prisma.course.update({
      where: { courseId },
      data: {
        ...allNewFields,
        isEnriched: true,
        updatedAt: new Date(),
      },
    });

    // Calculate after enrichment percentage
    const afterCourse = { ...course, ...allNewFields };
    const afterPct = calculateEnrichmentPct(afterCourse as any);

    return NextResponse.json({
      success: true,
      courseId,
      courseName: course.courseName,
      beforePct,
      afterPct,
      fieldsEnriched: totalFieldsEnriched,
      ruleBasedFields: Object.keys(ruleFields),
      aiFields: Object.keys(aiFields),
      enrichedData: allNewFields,
      aiError,
    });
  } catch (error: any) {
    console.error("Course enrichment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
