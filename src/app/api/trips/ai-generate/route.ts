import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ─── AI Trip Generation (Rule-based) ─── */

interface CourseRow {
  course_id: number;
  course_name: string;
  facility_name: string | null;
  city: string | null;
  state: string | null;
  country: string;
  green_fee_low: number | null;
  green_fee_high: number | null;
  chameleon_score: number | null;
  course_style: string | null;
  access_type: string | null;
  latitude: number | null;
  longitude: number | null;
  walking_policy: string | null;
  primary_image_url: string | null;
}

// Budget tiers map to green fee ranges
const BUDGET_TIERS: Record<string, { min: number; max: number }> = {
  budget: { min: 0, max: 100 },
  moderate: { min: 50, max: 200 },
  premium: { min: 150, max: 400 },
  luxury: { min: 300, max: 2000 },
};

// Region keyword matching
const REGION_KEYWORDS: Record<string, string[]> = {
  "Scottsdale, AZ": ["scottsdale", "arizona", "desert", "phoenix"],
  "Pinehurst, NC": ["pinehurst", "north carolina", "sandhills"],
  "Myrtle Beach, SC": ["myrtle beach", "south carolina", "myrtle"],
  "Monterey, CA": ["monterey", "pebble beach", "carmel", "california coast"],
  "Bandon, OR": ["bandon", "oregon", "bandon dunes"],
  "St Andrews, Scotland": ["st andrews", "scotland", "scottish", "links", "british"],
  "Palm Springs, CA": ["palm springs", "palm desert", "coachella"],
  "Orlando, FL": ["orlando", "florida", "central florida"],
  "Hilton Head, SC": ["hilton head", "lowcountry"],
  "Kiawah Island, SC": ["kiawah", "kiawah island"],
};

function detectBudgetTier(budgetPerPerson: number, days: number): string {
  const dailyBudget = budgetPerPerson / days;
  if (dailyBudget <= 150) return "budget";
  if (dailyBudget <= 300) return "moderate";
  if (dailyBudget <= 500) return "premium";
  return "luxury";
}

function parseNaturalLanguage(input: string) {
  const result: {
    days: number;
    players: number;
    budget: number | null;
    destination: string | null;
    style: string | null;
  } = {
    days: 3,
    players: 4,
    budget: null,
    destination: null,
    style: null,
  };

  // Extract days
  const dayMatch = input.match(/(\d+)[- ]?day/i);
  if (dayMatch) result.days = parseInt(dayMatch[1]);

  // Extract players
  const playerMatch = input.match(/(\d+)\s*(player|golfer|people|person|guy|buddy|buddies)/i);
  if (playerMatch) result.players = parseInt(playerMatch[1]);
  const forMatch = input.match(/for\s+(\d+)/i);
  if (forMatch && !playerMatch) result.players = parseInt(forMatch[1]);

  // Extract budget
  const budgetMatch = input.match(/\$([0-9,]+)/);
  if (budgetMatch) result.budget = parseInt(budgetMatch[1].replace(/,/g, ""));
  const budgetMatch2 = input.match(/budget\s*(?:of\s*)?\$?([0-9,]+)/i);
  if (budgetMatch2 && !budgetMatch)
    result.budget = parseInt(budgetMatch2[1].replace(/,/g, ""));

  // Extract destination
  const lowerInput = input.toLowerCase();
  for (const [dest, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((k) => lowerInput.includes(k))) {
      result.destination = dest;
      break;
    }
  }

  // If no keyword match, try to extract location after "to" or "in"
  if (!result.destination) {
    const locMatch = input.match(/(?:to|in|near|around)\s+([A-Z][a-zA-Z\s,]+?)(?:\s+for|\s+with|\s*$)/);
    if (locMatch) result.destination = locMatch[1].trim();
  }

  // Extract style preferences
  if (lowerInput.includes("links")) result.style = "Links";
  else if (lowerInput.includes("desert")) result.style = "Desert";
  else if (lowerInput.includes("parkland")) result.style = "Parkland";
  else if (lowerInput.includes("resort")) result.style = "Resort";

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      prompt,
      destination,
      days = 3,
      players = 4,
      budgetPerPerson,
      style,
    } = body;

    // If natural language prompt provided, parse it
    let parsed = { days, players, budget: budgetPerPerson, destination, style };
    if (prompt) {
      parsed = { ...parsed, ...parseNaturalLanguage(prompt) };
    }

    const numDays = Math.min(Math.max(parsed.days, 1), 10);
    const coursesNeeded = numDays; // One course per day

    // Build SQL query to find suitable courses
    const conditions: string[] = [];
    const params: any[] = [];

    if (parsed.destination) {
      conditions.push(`(
        LOWER(c.city) LIKE $${params.length + 1}
        OR LOWER(c.state) LIKE $${params.length + 1}
        OR LOWER(c.country) LIKE $${params.length + 1}
        OR LOWER(c.facility_name) LIKE $${params.length + 1}
        OR LOWER(c.course_name) LIKE $${params.length + 1}
      )`);
      params.push(`%${parsed.destination.toLowerCase().split(",")[0].trim()}%`);
    }

    if (parsed.budget) {
      const tier = detectBudgetTier(parsed.budget, numDays);
      const range = BUDGET_TIERS[tier];
      conditions.push(`(c.green_fee_low IS NULL OR c.green_fee_low <= $${params.length + 1})`);
      params.push(range.max);
    }

    if (parsed.style) {
      conditions.push(`LOWER(c.course_style) = $${params.length + 1}`);
      params.push(parsed.style.toLowerCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        c.course_id,
        c.course_name,
        c.facility_name,
        c.city,
        c.state,
        c.country,
        c.green_fee_low,
        c.green_fee_high,
        c.course_style,
        c.access_type,
        c.latitude,
        c.longitude,
        c.walking_policy,
        cs.chameleon_score,
        (SELECT cm.image_url FROM course_media cm WHERE cm.course_id = c.course_id AND cm.is_primary = true LIMIT 1) as primary_image_url
      FROM courses c
      LEFT JOIN chameleon_scores cs ON cs.course_id = c.course_id
      ${whereClause}
      ORDER BY cs.chameleon_score DESC NULLS LAST, c.course_name ASC
      LIMIT $${params.length + 1}
    `;
    params.push(coursesNeeded * 3); // Fetch more for variety

    const courses = await prisma.$queryRawUnsafe<CourseRow[]>(query, ...params);

    // Select top courses, ensuring variety
    const selected = courses.slice(0, coursesNeeded);

    // Build itinerary
    const itinerary = selected.map((course, idx) => ({
      day: idx + 1,
      course: {
        courseId: Number(course.course_id),
        courseName: course.course_name,
        facilityName: course.facility_name,
        city: course.city,
        state: course.state,
        country: course.country,
        greenFeeLow: course.green_fee_low ? Number(course.green_fee_low) : null,
        greenFeeHigh: course.green_fee_high ? Number(course.green_fee_high) : null,
        chameleonScore: course.chameleon_score ? Number(course.chameleon_score) : null,
        courseStyle: course.course_style,
        accessType: course.access_type,
        walkingPolicy: course.walking_policy,
        primaryImageUrl: course.primary_image_url,
      },
      teeTimePreference: idx === 0 ? "morning" : "flexible",
      notes: "",
    }));

    // Estimate total cost
    const totalGreenFees = selected.reduce((sum, c) => {
      return sum + (c.green_fee_low ? Number(c.green_fee_low) : 150);
    }, 0);

    const estimatedLodgingPerNight = parsed.budget
      ? Math.min(parsed.budget / numDays * 0.4, 300)
      : 150;

    return NextResponse.json({
      suggestion: {
        title: `${numDays}-Day Golf Trip${parsed.destination ? ` to ${parsed.destination}` : ""}`,
        destination: parsed.destination || (selected[0] ? `${selected[0].city}, ${selected[0].state}` : "TBD"),
        days: numDays,
        players: parsed.players,
        itinerary,
        estimatedCosts: {
          totalGreenFees,
          estimatedLodgingTotal: Math.round(estimatedLodgingPerNight * (numDays - 1)),
          estimatedPerPerson: Math.round(
            (totalGreenFees + estimatedLodgingPerNight * (numDays - 1)) / parsed.players
          ),
        },
        coursesFound: courses.length,
      },
    });
  } catch (error: any) {
    console.error("POST /api/trips/ai-generate error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
