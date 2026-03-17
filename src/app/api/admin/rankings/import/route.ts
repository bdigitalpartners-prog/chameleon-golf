import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

interface ExtractedEntry {
  rank: number;
  courseName: string;
  location?: string;
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { url, listId } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: "Perplexity API key not configured" },
        { status: 500 }
      );
    }

    // Use Perplexity Sonar to read the page and extract the ranking list
    const extractionPrompt = `Go to this URL and extract the complete ranked list of golf courses: ${url}

Extract EVERY course from the ranking list on that page. For each course, provide:
1. The rank/position number
2. The exact course name as listed
3. The location (city, state/country) if shown

Return the data as a JSON array with this exact format, nothing else — no markdown, no explanation, just the raw JSON array:
[{"rank": 1, "courseName": "Pine Valley Golf Club", "location": "Pine Valley, NJ"}, ...]

Important:
- Include ALL courses on the list, not just a sample
- Use the exact course names as they appear on the page
- If there are ties, give them the same rank number
- Return ONLY the JSON array, no other text`;

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
              "You are a data extraction assistant. Extract structured data from web pages. Return only valid JSON, no markdown formatting or explanation.",
          },
          { role: "user", content: extractionPrompt },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!perplexityRes.ok) {
      const errText = await perplexityRes.text();
      console.error("Perplexity API error:", errText);
      return NextResponse.json(
        { error: "Failed to fetch ranking data from URL" },
        { status: 502 }
      );
    }

    const perplexityData = await perplexityRes.json();
    const content =
      perplexityData.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (may be wrapped in markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let extracted: ExtractedEntry[];
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse extraction result:", content);
      return NextResponse.json(
        {
          error: "Could not parse ranking data from the page",
          raw: content.substring(0, 500),
        },
        { status: 422 }
      );
    }

    if (!Array.isArray(extracted) || extracted.length === 0) {
      return NextResponse.json(
        { error: "No courses found on the page" },
        { status: 422 }
      );
    }

    // Match extracted course names to existing courses in the database
    const allCourses = await prisma.course.findMany({
      select: {
        courseId: true,
        courseName: true,
        facilityName: true,
        city: true,
        state: true,
        country: true,
      },
    });

    // Build a lookup for fuzzy matching
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/['']/g, "'")
        .replace(/golf club|golf course|country club|golf links|golf & country club|resort|hotel/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    const matchedEntries: Array<{
      rank: number;
      courseName: string;
      location?: string;
      matchedCourseId: number | null;
      matchedCourseName: string | null;
      matchedLocation: string | null;
      confidence: "exact" | "high" | "partial" | "none";
    }> = [];

    for (const entry of extracted) {
      const normalizedName = normalize(entry.courseName);
      let bestMatch: (typeof allCourses)[0] | null = null;
      let confidence: "exact" | "high" | "partial" | "none" = "none";

      // Try exact match first
      for (const course of allCourses) {
        const cn = normalize(course.courseName);
        const fn = course.facilityName
          ? normalize(course.facilityName)
          : "";

        if (
          cn === normalizedName ||
          fn === normalizedName ||
          course.courseName.toLowerCase() ===
            entry.courseName.toLowerCase()
        ) {
          bestMatch = course;
          confidence = "exact";
          break;
        }
      }

      // Try contains match
      if (!bestMatch) {
        for (const course of allCourses) {
          const cn = normalize(course.courseName);
          if (
            cn.includes(normalizedName) ||
            normalizedName.includes(cn)
          ) {
            // If location also matches, higher confidence
            if (
              entry.location &&
              course.state &&
              entry.location
                .toLowerCase()
                .includes(course.state.toLowerCase())
            ) {
              bestMatch = course;
              confidence = "high";
              break;
            } else if (!bestMatch) {
              bestMatch = course;
              confidence = "partial";
            }
          }
        }
      }

      // Try word overlap for remaining unmatched
      if (!bestMatch) {
        const entryWords = normalizedName.split(" ").filter((w) => w.length > 2);
        let bestOverlap = 0;
        for (const course of allCourses) {
          const cn = normalize(course.courseName);
          const courseWords = cn.split(" ").filter((w) => w.length > 2);
          const overlap = entryWords.filter((w) =>
            courseWords.includes(w)
          ).length;
          const ratio = overlap / Math.max(entryWords.length, 1);
          if (ratio > 0.6 && overlap > bestOverlap) {
            bestOverlap = overlap;
            bestMatch = course;
            confidence = "partial";
          }
        }
      }

      matchedEntries.push({
        rank: entry.rank,
        courseName: entry.courseName,
        location: entry.location,
        matchedCourseId: bestMatch?.courseId ?? null,
        matchedCourseName: bestMatch?.courseName ?? null,
        matchedLocation: bestMatch
          ? `${bestMatch.city || ""}, ${bestMatch.state || ""}`.replace(
              /^, |, $/,
              ""
            )
          : null,
        confidence,
      });
    }

    // If listId is provided, auto-import the matched entries
    if (listId) {
      const toImport = matchedEntries.filter(
        (e) => e.matchedCourseId && (e.confidence === "exact" || e.confidence === "high")
      );

      let imported = 0;
      let skipped = 0;
      for (const entry of toImport) {
        try {
          await prisma.rankingEntry.upsert({
            where: {
              listId_courseId: {
                listId: parseInt(listId, 10),
                courseId: entry.matchedCourseId!,
              },
            },
            update: { rankPosition: entry.rank },
            create: {
              listId: parseInt(listId, 10),
              courseId: entry.matchedCourseId!,
              rankPosition: entry.rank,
            },
          });
          imported++;
        } catch {
          skipped++;
        }
      }

      return NextResponse.json({
        imported,
        skipped,
        totalExtracted: extracted.length,
        entries: matchedEntries,
      });
    }

    // Preview mode — return matched entries without importing
    return NextResponse.json({
      totalExtracted: extracted.length,
      matched: matchedEntries.filter((e) => e.matchedCourseId).length,
      unmatched: matchedEntries.filter((e) => !e.matchedCourseId).length,
      entries: matchedEntries,
    });
  } catch (err: any) {
    console.error("Rankings import error:", err);
    return NextResponse.json(
      { error: "Import failed: " + err.message },
      { status: 500 }
    );
  }
}
