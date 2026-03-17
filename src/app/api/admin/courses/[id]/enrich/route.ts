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

// ─── All fields the AI can research and fill ────────────────────────────

// String fields
const AI_STRING_FIELDS = [
  "description",
  "originalArchitect",
  "courseStyle",
  "accessType",
  "courseType",
  "greenFeeCurrency",
  "walkingPolicy",
  "dressCode",
  "caddieAvailability",
  "websiteUrl",
  "phone",
  "email",
  "streetAddress",
  "city",
  "state",
  "zipCode",
  "fairwayGrass",
  "greenGrass",
  "renovationArchitect",
  "designPhilosophy",
  "whatToExpect",
  "courseStrategy",
  "tagline",
  // Policies & access
  "caddieFee",
  "cartPolicy",
  "cartFee",
  "cellPhonePolicy",
  "howToGetOn",
  "resortAffiliateAccess",
  "guestPolicy",
  "bookingUrl",
  "priceTier",
  // Course character
  "signatureHoleDescription",
  "paceOfPlayNotes",
  // Conditions
  "greenSpeed",
  "aerationSchedule",
  "bestConditionMonths",
  // Architecture
  "architectBio",
  "renovationNotes",
  // Lodging
  "resortNameField",
  "resortBookingUrl",
  // Social
  "instagramUrl",
  "twitterUrl",
  "facebookUrl",
  "tiktokUrl",
] as const;

// Numeric fields
const AI_NUMERIC_FIELDS = [
  "yearOpened",
  "par",
  "numHoles",
  "greenFeeLow",
  "greenFeeHigh",
  "latitude",
  "longitude",
  "renovationYear",
  "signatureHoleNumber",
  "greenFeePeak",
  "greenFeeOffPeak",
  "greenFeeTwilight",
] as const;

// Boolean fields
const AI_BOOLEAN_FIELDS = [
  "clubRentalAvailable",
  "onSiteLodging",
  "includesCart",
] as const;

// JSON fields (arrays/objects)
const AI_JSON_FIELDS = [
  "insiderTips",
  "bestPar3",
  "bestPar4",
  "bestPar5",
  "championshipHistory",
  "famousMoments",
  "practiceFacilities",
  "stayAndPlayPackages",
] as const;

// Combined set of all AI-enrichable field names
const ALL_AI_FIELDS = [
  ...AI_STRING_FIELDS,
  ...AI_NUMERIC_FIELDS,
  ...AI_BOOLEAN_FIELDS,
  ...AI_JSON_FIELDS,
] as const;

interface EnrichmentContext {
  courseName: string;
  country: string;
  city: string | null;
  state: string | null;
  existingFields: Record<string, any>;
  missingFields: string[];
}

// ─── Prompt Builder ─────────────────────────────────────────────────────

function buildPrompt(ctx: EnrichmentContext): string {
  const existingInfo = Object.entries(ctx.existingFields)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  const location = [ctx.city, ctx.state, ctx.country]
    .filter(Boolean)
    .join(", ") || "unknown location";

  const missingList = ctx.missingFields.join(", ");

  return `Research the golf course "${ctx.courseName}" located in ${location}.

${existingInfo ? `We already know:\n${existingInfo}\n` : ""}
We are MISSING the following fields and need you to find accurate data for as many as possible: ${missingList}

Return a JSON object with ONLY the fields you can confidently fill in. Use these EXACT field names and formats:

── STRING FIELDS ──
"description": "2-4 sentence overview — character, history, what makes it notable",
"tagline": "Short compelling tagline under 15 words",
"originalArchitect": "Name of the original course designer",
"renovationArchitect": "Name of renovation architect if applicable",
"renovationNotes": "Brief notes about renovations",
"designPhilosophy": "The architectural philosophy behind the design",
"architectBio": "2-3 sentence bio of the original architect",
"courseStyle": one of "Links" | "Parkland" | "Desert" | "Mountain" | "Heathland" | "Coastal" | "Tropical" | "Prairie" | "Woodland",
"accessType": one of "Private" | "Public" | "Resort" | "Semi-Private" | "Municipal",
"courseType": one of "Championship" | "Executive" | "Regulation" | "Resort Course" | "9-Hole",
"walkingPolicy": one of "Walking Only" | "Walking Allowed" | "Walking at Certain Times" | "Cart Required" | "Unrestricted",
"dressCode": "description of dress code policy",
"caddieAvailability": one of "Required" | "Available" | "Not Available",
"caddieFee": "e.g. $50-80 per bag",
"cartPolicy": "e.g. Cart included in green fee | Cart rental available",
"cartFee": "e.g. $25 per rider",
"cellPhonePolicy": "e.g. Allowed in parking lot only | Silent mode on course",
"howToGetOn": "How to access this course — especially important for private clubs (reciprocal arrangements, guest policies, special events, etc.)",
"resortAffiliateAccess": "Resort or affiliate access details if applicable",
"guestPolicy": "Guest policy details — how members can bring guests, unaccompanied play rules",
"priceTier": one of "$" | "$$" | "$$$" | "$$$$",
"greenFeeCurrency": "USD",
"websiteUrl": "https://...",
"bookingUrl": "https://... direct booking link if available",
"phone": "+1-555-123-4567",
"email": "info@coursename.com",
"streetAddress": "123 Golf Club Road",
"city": "City Name",
"state": "State abbreviation (e.g. CA, NY)",
"zipCode": "12345",
"fairwayGrass": "e.g. Bentgrass | Bermuda | Zoysia | Fescue | Paspalum",
"greenGrass": "e.g. Bentgrass | Bermuda | Poa annua | TifEagle | MiniVerde",
"greenSpeed": "e.g. 11-12 on the stimpmeter",
"whatToExpect": "2-3 sentences about what a golfer should expect playing here for the first time",
"courseStrategy": "2-3 sentences of strategic tips for playing the course",
"signatureHoleDescription": "Description of the signature hole",
"paceOfPlayNotes": "e.g. Strict 4-hour pace policy, rangers on course",
"aerationSchedule": "e.g. Greens aerified in March and September",
"bestConditionMonths": "e.g. April-May and October-November",
"resortNameField": "Name of the resort if course is resort-affiliated",
"resortBookingUrl": "https://... resort booking link",
"instagramUrl": "https://instagram.com/...",
"twitterUrl": "https://twitter.com/...",
"facebookUrl": "https://facebook.com/...",
"tiktokUrl": "https://tiktok.com/@...",

── NUMERIC FIELDS ──
"yearOpened": 1920,
"renovationYear": 2015,
"par": 72,
"numHoles": 18,
"greenFeeLow": 75,
"greenFeeHigh": 250,
"greenFeePeak": 300,
"greenFeeOffPeak": 150,
"greenFeeTwilight": 100,
"latitude": 40.1234567,
"longitude": -74.1234567,
"signatureHoleNumber": 7,

── BOOLEAN FIELDS ──
"clubRentalAvailable": true,
"onSiteLodging": true,
"includesCart": false,

── JSON FIELDS ──
"insiderTips": ["Tip 1 about the course", "Tip 2 about booking", "Tip 3 about best holes", ...] (array of 4-8 specific insider tips),
"bestPar3": {"holeNumber": 7, "yardage": 175, "description": "Scenic par 3 over water"},
"bestPar4": {"holeNumber": 13, "yardage": 430, "description": "Dogleg right with elevated green"},
"bestPar5": {"holeNumber": 15, "yardage": 545, "description": "Reachable in two with risk/reward"},
"championshipHistory": [{"event": "US Open", "year": 2020, "winner": "Player Name"}, ...] (major tournaments held here),
"famousMoments": [{"year": 1972, "description": "Tom Watson's chip-in on 17"}, ...] (famous moments in course history),
"practiceFacilities": {"drivingRange": true, "puttingGreen": true, "shortGameArea": true, "practiceBunker": false, "teachingCenter": true},
"stayAndPlayPackages": [{"name": "Weekend Package", "description": "2 nights + 2 rounds", "priceFrom": 599}, ...],

RULES:
- Return ONLY valid JSON — no markdown, no explanation, no text outside the JSON
- Only include fields you are CONFIDENT about — do not guess or fabricate
- For numeric values, use numbers not strings
- For boolean values, use true/false not strings
- For JSON arrays/objects, use proper JSON format
- Do NOT include fields that already have data
- For private clubs, "howToGetOn" is especially valuable — research reciprocal arrangements, guest policies, and any ways visitors can play
- For "insiderTips", include specific, actionable local knowledge — not generic advice
- For "championshipHistory" and "famousMoments", only include verified events`;
}

// ─── Response Parser ────────────────────────────────────────────────────

function parseAIResponse(rawContent: string): Record<string, any> {
  let cleaned = rawContent.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in AI response");

  return JSON.parse(match[0]);
}

// ─── Validation & Cleaning ──────────────────────────────────────────────

function validateAndClean(
  fields: Record<string, any>,
  missingFields: string[]
): Record<string, any> {
  const clean: Record<string, any> = {};
  const missingSet = new Set(missingFields);

  for (const [key, value] of Object.entries(fields)) {
    if (!missingSet.has(key)) continue;
    if (value === null || value === undefined || value === "") continue;

    // ── Numeric field validation ──
    if ((AI_NUMERIC_FIELDS as readonly string[]).includes(key)) {
      const num = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(num)) continue;

      switch (key) {
        case "par":
          if (num >= 27 && num <= 73) clean.par = num;
          break;
        case "numHoles":
          if ([9, 18, 27, 36].includes(num)) clean.numHoles = num;
          break;
        case "yearOpened":
        case "renovationYear":
          if (num >= 1800 && num <= 2026) clean[key] = num;
          break;
        case "greenFeeLow":
        case "greenFeeHigh":
        case "greenFeePeak":
        case "greenFeeOffPeak":
        case "greenFeeTwilight":
          if (num >= 0 && num <= 50000) clean[key] = num;
          break;
        case "latitude":
          if (num >= -90 && num <= 90) clean.latitude = num;
          break;
        case "longitude":
          if (num >= -180 && num <= 180) clean.longitude = num;
          break;
        case "signatureHoleNumber":
          if (num >= 1 && num <= 36 && Number.isInteger(num)) clean[key] = num;
          break;
        default:
          clean[key] = num;
      }
      continue;
    }

    // ── Boolean field validation ──
    if ((AI_BOOLEAN_FIELDS as readonly string[]).includes(key)) {
      if (typeof value === "boolean") {
        clean[key] = value;
      } else if (value === "true" || value === "false") {
        clean[key] = value === "true";
      }
      continue;
    }

    // ── JSON field validation ──
    if ((AI_JSON_FIELDS as readonly string[]).includes(key)) {
      // Accept arrays and objects directly
      if (typeof value === "object" && value !== null) {
        // Basic structure validation per field
        switch (key) {
          case "insiderTips":
            if (Array.isArray(value) && value.length > 0 && value.every((t: any) => typeof t === "string")) {
              clean[key] = value.slice(0, 12); // Cap at 12 tips
            }
            break;
          case "bestPar3":
          case "bestPar4":
          case "bestPar5":
            if (value.holeNumber && value.description) {
              clean[key] = {
                holeNumber: typeof value.holeNumber === "number" ? value.holeNumber : parseInt(value.holeNumber),
                yardage: value.yardage ? (typeof value.yardage === "number" ? value.yardage : parseInt(value.yardage)) : null,
                description: String(value.description).slice(0, 500),
              };
            }
            break;
          case "championshipHistory":
            if (Array.isArray(value) && value.length > 0) {
              clean[key] = value
                .filter((e: any) => e.event && e.year)
                .map((e: any) => ({
                  event: String(e.event),
                  year: typeof e.year === "number" ? e.year : parseInt(e.year),
                  winner: e.winner ? String(e.winner) : null,
                }))
                .slice(0, 30);
            }
            break;
          case "famousMoments":
            if (Array.isArray(value) && value.length > 0) {
              clean[key] = value
                .filter((m: any) => m.description)
                .map((m: any) => ({
                  year: m.year ? (typeof m.year === "number" ? m.year : parseInt(m.year)) : null,
                  description: String(m.description).slice(0, 500),
                }))
                .slice(0, 15);
            }
            break;
          case "practiceFacilities":
            // Accept object with boolean values
            if (!Array.isArray(value)) {
              const pf: Record<string, boolean> = {};
              const validKeys = ["drivingRange", "puttingGreen", "shortGameArea", "practiceBunker", "teachingCenter"];
              for (const k of validKeys) {
                if (k in value) pf[k] = Boolean(value[k]);
              }
              if (Object.keys(pf).length > 0) clean[key] = pf;
            }
            break;
          case "stayAndPlayPackages":
            if (Array.isArray(value) && value.length > 0) {
              clean[key] = value
                .filter((p: any) => p.name)
                .map((p: any) => ({
                  name: String(p.name),
                  description: p.description ? String(p.description) : null,
                  priceFrom: p.priceFrom ? Number(p.priceFrom) : null,
                }))
                .slice(0, 10);
            }
            break;
          default:
            clean[key] = value;
        }
      }
      continue;
    }

    // ── Enum-constrained string fields ──
    switch (key) {
      case "courseStyle": {
        const valid = ["Links", "Parkland", "Desert", "Mountain", "Heathland", "Coastal", "Links-Parkland", "Tropical", "Prairie", "Woodland"];
        if (typeof value === "string" && valid.includes(value)) clean[key] = value;
        continue;
      }
      case "accessType": {
        const valid = ["Private", "Public", "Resort", "Semi-Private", "Municipal"];
        if (typeof value === "string" && valid.includes(value)) clean[key] = value;
        continue;
      }
      case "courseType": {
        const valid = ["Championship", "Executive", "Regulation", "Resort Course", "9-Hole"];
        if (typeof value === "string" && valid.includes(value)) clean[key] = value;
        continue;
      }
      case "walkingPolicy": {
        const valid = ["Walking Only", "Walking Allowed", "Walking at Certain Times", "Cart Required", "Unrestricted"];
        if (typeof value === "string" && valid.includes(value)) clean[key] = value;
        continue;
      }
      case "caddieAvailability": {
        const valid = ["Required", "Available", "Not Available"];
        if (typeof value === "string" && valid.includes(value)) clean[key] = value;
        continue;
      }
      case "priceTier": {
        const valid = ["$", "$$", "$$$", "$$$$"];
        if (typeof value === "string" && valid.includes(value)) clean[key] = value;
        continue;
      }
    }

    // ── URL fields — basic validation ──
    if (key.endsWith("Url") || key === "bookingUrl" || key === "websiteUrl" || key === "resortBookingUrl") {
      if (typeof value === "string" && value.startsWith("http")) {
        clean[key] = value.trim().slice(0, 500);
      }
      continue;
    }

    // ── General string fields ──
    if ((AI_STRING_FIELDS as readonly string[]).includes(key)) {
      if (typeof value === "string" && value.trim().length > 0) {
        // Cap long text fields
        const maxLen = ["description", "whatToExpect", "courseStrategy", "howToGetOn", "architectBio", "designPhilosophy"].includes(key) ? 2000 : 500;
        clean[key] = value.trim().slice(0, maxLen);
      }
      continue;
    }
  }

  return clean;
}

// ─── Main Handler ───────────────────────────────────────────────────────

/**
 * POST /api/admin/courses/[id]/enrich
 *
 * AI-powered enrichment for a single course using Perplexity Sonar API.
 * Researches the course online and fills ALL missing fields.
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

    // Determine which fields are missing across ALL AI-enrichable fields
    const existingFields: Record<string, any> = {};
    const missingFields: string[] = [];

    for (const field of ALL_AI_FIELDS) {
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
        city: course.city,
        state: course.state,
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
                  "You are an expert golf course research assistant with deep knowledge of golf courses worldwide. Find accurate, factual, specific information about golf courses including policies, history, insider tips, and character details. Return only valid JSON with the requested data fields. Do not make up information — only include data you can verify. Be thorough — fill in as many fields as possible.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 8000,
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
