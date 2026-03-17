import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/**
 * POST /api/admin/courses/discover
 *
 * Uses Perplexity Sonar to discover golf courses in a given US state,
 * then de-duplicates against the existing database.
 *
 * Body: { state: "CA", page?: number }
 * page=1 returns first batch, page=2 returns additional courses, etc.
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "Perplexity API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { state, page = 1 } = body;

    if (!state || !STATE_NAMES[state]) {
      return NextResponse.json(
        { error: "Valid US state abbreviation required" },
        { status: 400 }
      );
    }

    const stateName = STATE_NAMES[state];

    // Get existing courses in this state for de-duplication
    const existingCourses = await prisma.course.findMany({
      where: { state: { in: [state, stateName], mode: "insensitive" } },
      select: { courseId: true, courseName: true, city: true },
    });

    const existingNames = new Set(
      existingCourses.map((c) => normalize(c.courseName))
    );

    // Build the prompt for Perplexity
    const pageOffset = (page - 1) * 50;
    const prompt = page === 1
      ? `List as many golf courses as possible in ${stateName}, USA. Include every golf course you can find — public, private, municipal, resort, semi-private, military, and university courses. For each course, provide the exact name, city, and type (Public/Private/Resort/Semi-Private/Municipal).

Return a JSON array with this exact format, nothing else:
[{"name": "Course Name", "city": "City Name", "type": "Public"}, ...]

Rules:
- Return ONLY valid JSON array, no markdown, no explanation
- Include at least 50 courses if the state has that many
- Include the full proper name of each course (e.g., "Pebble Beach Golf Links" not just "Pebble Beach")
- For type, use ONLY one of: Public, Private, Resort, Semi-Private, Municipal
- Sort alphabetically by name`
      : `List more golf courses in ${stateName}, USA that are LESS WELL KNOWN. Focus on smaller, local, 9-hole, executive, and lesser-known courses. Skip the famous/well-known courses and focus on courses that would be harder to find. Aim for courses ranked outside the top in the state.

Return a JSON array with this exact format, nothing else:
[{"name": "Course Name", "city": "City Name", "type": "Public"}, ...]

Rules:
- Return ONLY valid JSON array, no markdown, no explanation
- Include at least 40 courses
- Include the full proper name of each course
- For type, use ONLY one of: Public, Private, Resort, Semi-Private, Municipal
- Do not repeat well-known/famous courses
- Sort alphabetically by name`;

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
              "You are a golf course database researcher. Find accurate, factual information about golf courses. Return only valid JSON, no markdown formatting or explanation.",
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
      return NextResponse.json(
        { error: "Failed to discover courses from Perplexity" },
        { status: 502 }
      );
    }

    const data = await perplexityRes.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON array from response
    let jsonStr = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    let discovered: Array<{ name: string; city: string; type?: string }>;
    try {
      discovered = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse discovery result:", content);
      return NextResponse.json(
        { error: "Could not parse course list from AI response", raw: content.substring(0, 500) },
        { status: 422 }
      );
    }

    if (!Array.isArray(discovered) || discovered.length === 0) {
      return NextResponse.json(
        { error: "No courses found for this state" },
        { status: 422 }
      );
    }

    // De-duplicate against existing DB courses
    const results = discovered.map((d) => {
      const normalizedName = normalize(d.name);
      const alreadyExists = existingNames.has(normalizedName) ||
        existingCourses.some((ec) => {
          const ecNorm = normalize(ec.courseName);
          return ecNorm.includes(normalizedName) || normalizedName.includes(ecNorm);
        });

      return {
        name: d.name,
        city: d.city || null,
        type: d.type || null,
        alreadyExists,
      };
    });

    const newCourses = results.filter((r) => !r.alreadyExists);
    const existingCount = results.filter((r) => r.alreadyExists).length;

    return NextResponse.json({
      state,
      stateName,
      totalDiscovered: results.length,
      newCourses: newCourses.length,
      alreadyExist: existingCount,
      existingInDb: existingCourses.length,
      courses: results,
    });
  } catch (error: any) {
    console.error("Course discovery error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/golf club|golf course|country club|golf links|golf & country club|resort|hotel|the /gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
