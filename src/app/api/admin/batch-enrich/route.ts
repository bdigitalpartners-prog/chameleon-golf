import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import {
  enrichCourse,
  calculateEnrichmentPct,
  type CourseData,
} from "@/lib/course-enrichment";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for batch processing

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
  "greenFeePeak",
  "greenFeeOffPeak",
  "greenFeeTwilight",
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
  "greenFeePeak": 300,
  "greenFeeOffPeak": 150,
  "greenFeeTwilight": 100,
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
  let cleaned = rawContent.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
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
      case "greenFeePeak":
      case "greenFeeOffPeak":
      case "greenFeeTwilight":
        if (typeof value === "number" && value >= 0 && value <= 10000) clean[key] = value;
        break;
      case "latitude":
        if (typeof value === "number" && value >= -90 && value <= 90) clean.latitude = value;
        break;
      case "longitude":
        if (typeof value === "number" && value >= -180 && value <= 180) clean.longitude = value;
        break;
      case "courseStyle": {
        const validStyles = ["Links", "Parkland", "Desert", "Mountain", "Heathland", "Coastal", "Links-Parkland", "Tropical", "Prairie", "Woodland"];
        if (validStyles.includes(value)) clean.courseStyle = value;
        break;
      }
      case "accessType": {
        const validAccess = ["Private", "Public", "Resort", "Semi-Private", "Municipal"];
        if (validAccess.includes(value)) clean.accessType = value;
        break;
      }
      case "courseType": {
        const validTypes = ["Championship", "Executive", "Regulation", "Resort Course", "9-Hole"];
        if (validTypes.includes(value)) clean.courseType = value;
        break;
      }
      case "walkingPolicy": {
        const validPolicies = ["Walking Only", "Walking Allowed", "Walking at Certain Times", "Cart Required", "Unrestricted"];
        if (validPolicies.includes(value)) clean.walkingPolicy = value;
        break;
      }
      case "caddieAvailability": {
        const validCaddie = ["Required", "Available", "Not Available"];
        if (validCaddie.includes(value)) clean.caddieAvailability = value;
        break;
      }
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

async function enrichSingleCourseWithAI(
  course: any,
  ruleFields: Record<string, any>
): Promise<{
  ruleBasedFields: string[];
  aiFields: string[];
  allFields: Record<string, any>;
  aiError: string | null;
}> {
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

  // Merge rule-based results
  const mergedExisting = { ...existingFields, ...ruleFields };
  const stillMissing = missingFields.filter((f) => !(f in ruleFields));

  let aiFields: Record<string, any> = {};
  let aiError: string | null = null;

  if (stillMissing.length > 0 && PERPLEXITY_API_KEY) {
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
        aiError = "Perplexity API returned an error";
      } else {
        const data = await perplexityRes.json();
        const rawContent = data.choices?.[0]?.message?.content || "";
        const parsed = parseAIResponse(rawContent);
        aiFields = validateAndClean(parsed, stillMissing);
      }
    } catch (err: any) {
      console.error("Perplexity enrichment error:", err);
      aiError = `AI enrichment failed: ${err.message}`;
    }
  } else if (!PERPLEXITY_API_KEY && stillMissing.length > 0) {
    aiError = "Perplexity API key not configured — only rule-based enrichment applied";
  }

  const allFields = { ...ruleFields, ...aiFields };

  return {
    ruleBasedFields: Object.keys(ruleFields),
    aiFields: Object.keys(aiFields),
    allFields,
    aiError,
  };
}

async function tryLinkArchitect(
  courseId: number,
  architectName: string | null | undefined
): Promise<void> {
  if (!architectName) return;

  const architect = await prisma.architect.findFirst({
    where: {
      name: { equals: architectName, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (architect) {
    await prisma.course.update({
      where: { courseId },
      data: { architectId: architect.id },
    });
  }
}

/**
 * GET /api/admin/batch-enrich
 *
 * Get batch enrichment run history and current status.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const [runs, totalRuns, recentLogs] = await Promise.all([
      prisma.batchEnrichmentRun.findMany({
        orderBy: { startedAt: "desc" },
        take: limit,
        include: {
          _count: { select: { logs: true } },
        },
      }),
      prisma.batchEnrichmentRun.count(),
      prisma.courseEnrichmentLog.findMany({
        orderBy: { enrichedAt: "desc" },
        take: 50,
      }),
    ]);

    // Aggregate stats
    const completedRuns = runs.filter((r) => r.status === "completed");
    const totalFieldsFilled = completedRuns.reduce(
      (sum, r) => sum + r.totalFieldsFilled,
      0
    );
    const totalCoursesUpdated = completedRuns.reduce(
      (sum, r) => sum + r.coursesUpdated,
      0
    );

    return NextResponse.json({
      runs: runs.map((r) => ({
        ...r,
        avgBefore: r.avgBefore ? Number(r.avgBefore) : null,
        avgAfter: r.avgAfter ? Number(r.avgAfter) : null,
        logCount: r._count.logs,
      })),
      totalRuns,
      recentLogs: recentLogs.map((l) => ({
        ...l,
        beforePct: Number(l.beforePct),
        afterPct: Number(l.afterPct),
      })),
      aggregateStats: {
        totalFieldsFilled,
        totalCoursesUpdated,
        totalRuns: completedRuns.length,
      },
    });
  } catch (error: any) {
    console.error("Batch enrich GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/batch-enrich
 *
 * Trigger batch enrichment of courses using rule-based + AI enrichment.
 *
 * Query params:
 *   batchSize - number of courses to process (default 50, max 100)
 *   priority - "top-ranked-first" or "least-enriched-first" (default)
 *   dryRun - "true" to preview without writing
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const batchSize = Math.min(
      parseInt(searchParams.get("batchSize") || "50", 10),
      100
    );
    const priority = searchParams.get("priority") || "least-enriched-first";
    const dryRun = searchParams.get("dryRun") === "true";

    // Fetch courses to enrich based on priority
    let courses: any[];

    if (priority === "top-ranked-first") {
      // Get courses with rankings, prioritizing those with more list appearances
      // but that still have missing data
      courses = await prisma.course.findMany({
        where: {
          rankings: { some: {} },
        },
        select: {
          courseId: true,
          courseName: true,
          facilityName: true,
          description: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          par: true,
          yearOpened: true,
          originalArchitect: true,
          architectId: true,
          courseType: true,
          accessType: true,
          courseStyle: true,
          numHoles: true,
          greenFeeLow: true,
          greenFeeHigh: true,
          greenFeeCurrency: true,
          greenFeePeak: true,
          greenFeeOffPeak: true,
          greenFeeTwilight: true,
          walkingPolicy: true,
          dressCode: true,
          caddieAvailability: true,
          practiceFacilities: true,
          bestTimeToPlay: true,
          bestMonths: true,
          averageRoundTime: true,
          golfSeason: true,
          fairwayGrass: true,
          greenGrass: true,
          websiteUrl: true,
          phone: true,
          streetAddress: true,
          city: true,
          zipCode: true,
          renovationArchitect: true,
          renovationYear: true,
          designPhilosophy: true,
          whatToExpect: true,
          courseStrategy: true,
          tagline: true,
          numListsAppeared: true,
          _count: { select: { rankings: true } },
        },
        orderBy: [
          { numListsAppeared: "desc" },
          { courseId: "asc" },
        ],
        take: batchSize * 3, // fetch more so we can filter to under-enriched
      });

      // Filter to those below 80% enrichment and take batchSize
      courses = courses
        .map((c) => {
          const pct = calculateEnrichmentPct(c as any);
          return { ...c, enrichmentPct: pct };
        })
        .filter((c) => c.enrichmentPct < 80)
        .slice(0, batchSize);
    } else {
      // least-enriched-first: get all courses and sort by enrichment %
      const allCourses = await prisma.course.findMany({
        select: {
          courseId: true,
          courseName: true,
          facilityName: true,
          description: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          par: true,
          yearOpened: true,
          originalArchitect: true,
          architectId: true,
          courseType: true,
          accessType: true,
          courseStyle: true,
          numHoles: true,
          greenFeeLow: true,
          greenFeeHigh: true,
          greenFeeCurrency: true,
          greenFeePeak: true,
          greenFeeOffPeak: true,
          greenFeeTwilight: true,
          walkingPolicy: true,
          dressCode: true,
          caddieAvailability: true,
          practiceFacilities: true,
          bestTimeToPlay: true,
          bestMonths: true,
          averageRoundTime: true,
          golfSeason: true,
          fairwayGrass: true,
          greenGrass: true,
          websiteUrl: true,
          phone: true,
          streetAddress: true,
          city: true,
          zipCode: true,
          renovationArchitect: true,
          renovationYear: true,
          designPhilosophy: true,
          whatToExpect: true,
          courseStrategy: true,
          tagline: true,
          numListsAppeared: true,
        },
        orderBy: { courseId: "asc" },
      });

      courses = allCourses
        .map((c) => ({
          ...c,
          enrichmentPct: calculateEnrichmentPct(c as any),
        }))
        .sort((a, b) => a.enrichmentPct - b.enrichmentPct)
        .filter((c) => c.enrichmentPct < 95)
        .slice(0, batchSize);
    }

    if (courses.length === 0) {
      return NextResponse.json({
        success: true,
        dryRun,
        message: "No courses need enrichment",
        summary: {
          totalProcessed: 0,
          updated: 0,
          noChanges: 0,
          errors: 0,
          totalFieldsEnriched: 0,
        },
        results: [],
      });
    }

    // Create enrichment run record
    const run = await prisma.batchEnrichmentRun.create({
      data: {
        status: dryRun ? "dry_run" : "running",
        priority,
        batchSize,
        totalCourses: courses.length,
        dryRun,
      },
    });

    const results: {
      courseId: number;
      courseName: string;
      fieldsEnriched: number;
      ruleBasedFields: string[];
      aiFields: string[];
      beforePct: number;
      afterPct: number;
      status: string;
      error?: string;
    }[] = [];

    let totalFieldsEnriched = 0;
    let totalBeforePct = 0;
    let totalAfterPct = 0;

    for (let i = 0; i < courses.length; i++) {
      const raw = courses[i];

      // Serialize Decimals for rule-based enrichment
      const courseData: CourseData = {
        courseId: raw.courseId,
        courseName: raw.courseName,
        description: raw.description,
        state: raw.state,
        country: raw.country,
        latitude: raw.latitude ? Number(raw.latitude) : null,
        longitude: raw.longitude ? Number(raw.longitude) : null,
        par: raw.par,
        yearOpened: raw.yearOpened,
        originalArchitect: raw.originalArchitect,
        courseType: raw.courseType,
        accessType: raw.accessType,
        courseStyle: raw.courseStyle,
        greenFeeLow: raw.greenFeeLow ? Number(raw.greenFeeLow) : null,
        greenFeeHigh: raw.greenFeeHigh ? Number(raw.greenFeeHigh) : null,
        walkingPolicy: raw.walkingPolicy,
        dressCode: raw.dressCode,
        caddieAvailability: raw.caddieAvailability,
        practiceFacilities: raw.practiceFacilities,
        bestTimeToPlay: raw.bestTimeToPlay,
        bestMonths: raw.bestMonths,
        averageRoundTime: raw.averageRoundTime,
        golfSeason: raw.golfSeason,
        numHoles: raw.numHoles,
        fairwayGrass: raw.fairwayGrass,
        greenGrass: raw.greenGrass,
      };

      const beforePct = calculateEnrichmentPct(raw as any);
      totalBeforePct += beforePct;

      try {
        // Step 1: Rule-based enrichment
        const ruleResult = enrichCourse(courseData);
        const ruleFields = ruleResult.fields;

        // Step 2: AI enrichment
        const aiResult = await enrichSingleCourseWithAI(raw, ruleFields);
        const allFields = aiResult.allFields;
        const fieldCount = Object.keys(allFields).length;

        if (fieldCount === 0) {
          const afterPct = beforePct;
          totalAfterPct += afterPct;

          results.push({
            courseId: raw.courseId,
            courseName: raw.courseName,
            fieldsEnriched: 0,
            ruleBasedFields: [],
            aiFields: [],
            beforePct,
            afterPct,
            status: "no_changes",
          });

          // Log the no-change result
          if (!dryRun) {
            await prisma.courseEnrichmentLog.create({
              data: {
                runId: run.id,
                courseId: raw.courseId,
                courseName: raw.courseName,
                beforePct,
                afterPct,
                fieldsEnriched: 0,
                ruleBasedFields: [],
                aiFields: [],
                status: "no_changes",
              },
            });
          }
          continue;
        }

        const afterCourse = { ...raw, ...allFields };
        const afterPct = calculateEnrichmentPct(afterCourse as any);
        totalAfterPct += afterPct;

        if (!dryRun) {
          // Save to database
          await prisma.course.update({
            where: { courseId: raw.courseId },
            data: {
              ...allFields,
              isEnriched: true,
              updatedAt: new Date(),
            },
          });

          // Try to link architect if we found one
          const newArchitect =
            allFields.originalArchitect || raw.originalArchitect;
          if (newArchitect && !raw.architectId) {
            await tryLinkArchitect(raw.courseId, newArchitect);
          }

          // Log the enrichment
          await prisma.courseEnrichmentLog.create({
            data: {
              runId: run.id,
              courseId: raw.courseId,
              courseName: raw.courseName,
              beforePct,
              afterPct,
              fieldsEnriched: fieldCount,
              ruleBasedFields: aiResult.ruleBasedFields,
              aiFields: aiResult.aiFields,
              status: "success",
            },
          });
        }

        results.push({
          courseId: raw.courseId,
          courseName: raw.courseName,
          fieldsEnriched: fieldCount,
          ruleBasedFields: aiResult.ruleBasedFields,
          aiFields: aiResult.aiFields,
          beforePct,
          afterPct,
          status: dryRun ? "dry_run" : "updated",
        });

        totalFieldsEnriched += fieldCount;
      } catch (err: any) {
        console.error(
          `Batch enrich error for course ${raw.courseId}:`,
          err
        );
        const afterPct = beforePct;
        totalAfterPct += afterPct;

        results.push({
          courseId: raw.courseId,
          courseName: raw.courseName,
          fieldsEnriched: 0,
          ruleBasedFields: [],
          aiFields: [],
          beforePct,
          afterPct,
          status: "error",
          error: err.message,
        });

        if (!dryRun) {
          await prisma.courseEnrichmentLog.create({
            data: {
              runId: run.id,
              courseId: raw.courseId,
              courseName: raw.courseName,
              beforePct,
              afterPct,
              fieldsEnriched: 0,
              ruleBasedFields: [],
              aiFields: [],
              status: "error",
              errorMessage: err.message,
            },
          });
        }
      }

      // Rate limit delay between AI calls (1.5s)
      if (i < courses.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const noChanges = results.filter((r) => r.status === "no_changes").length;
    const errors = results.filter((r) => r.status === "error").length;

    // Update the run record
    await prisma.batchEnrichmentRun.update({
      where: { id: run.id },
      data: {
        status: dryRun ? "dry_run" : "completed",
        completedAt: new Date(),
        coursesProcessed: courses.length,
        coursesUpdated: updated,
        coursesErrored: errors,
        totalFieldsFilled: totalFieldsEnriched,
        avgBefore:
          courses.length > 0 ? totalBeforePct / courses.length : null,
        avgAfter:
          courses.length > 0 ? totalAfterPct / courses.length : null,
        errorSummary:
          errors > 0
            ? results
                .filter((r) => r.status === "error")
                .map((r) => `${r.courseName}: ${r.error}`)
                .join("; ")
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      dryRun,
      runId: run.id,
      priority,
      summary: {
        totalProcessed: courses.length,
        updated,
        noChanges,
        errors,
        totalFieldsEnriched,
        avgBeforePct:
          courses.length > 0
            ? Math.round(totalBeforePct / courses.length)
            : 0,
        avgAfterPct:
          courses.length > 0
            ? Math.round(totalAfterPct / courses.length)
            : 0,
      },
      results,
    });
  } catch (error: any) {
    console.error("Batch enrichment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
