import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for large import

/* ------------------------------------------------------------------ */
/*  State-code helpers                                                 */
/* ------------------------------------------------------------------ */

const STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR",
  California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

const VALID_STATE_CODES = new Set(Object.values(STATE_NAME_TO_CODE));

/** Clean dirty state codes like "TN, yardage: 7334, par: 72" or "AL,year_opened:" */
function cleanStateCode(raw: string | undefined, fullStateName: string): string {
  if (!raw) return STATE_NAME_TO_CODE[fullStateName] || "";
  const trimmed = raw.trim().split(/[,\s]/)[0].toUpperCase();
  if (VALID_STATE_CODES.has(trimmed)) return trimmed;
  return STATE_NAME_TO_CODE[fullStateName] || "";
}

/* ------------------------------------------------------------------ */
/*  Name normalisation for fuzzy matching                              */
/* ------------------------------------------------------------------ */

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`\-]/g, "")
    .replace(/\b(the|at|of|and|&|golf|course|club|links|resort|country|municipal|national)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Field parsers                                                      */
/* ------------------------------------------------------------------ */

function parsePar(raw?: string): number | null {
  if (!raw) return null;
  const m = raw.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function parseYear(raw?: string): number | null {
  if (!raw) return null;
  const m = raw.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

function parseGreenFee(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,]/g, "");
  const m = cleaned.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function parsePreviousRank(otherDetails?: string): number | null {
  if (!otherDetails) return null;
  const m = otherDetails.match(/previous\s*rank:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function normalizeAccessType(raw?: string): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (upper === "PUBLIC" || upper === "MUNICIPAL") return "Public";
  if (upper === "PRIVATE") return "Private";
  if (upper === "RESORT") return "Resort";
  if (upper === "SEMI-PRIVATE" || upper === "SEMIPRIVATE") return "Semi-Private";
  if (upper === "MILITARY") return "Military";
  return raw.trim();
}

/* ------------------------------------------------------------------ */
/*  Data shape from JSON                                               */
/* ------------------------------------------------------------------ */

interface GDCourse {
  rank: number;
  course_name: string;
  city?: string;
  state?: string;
  access_type?: string;
  architect?: string;
  year_opened?: string;
  description?: string;
  green_fee?: string;
  par?: string;
  yardage?: string;
  course_style?: string;
  other_details?: string;
}

interface GDState {
  state: string;         // full name
  source_url: string;
  total_courses: number;
  courses: GDCourse[];
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const data: GDState[] = await request.json();

    /* ---- 1. Upsert RankingSource for Golf Digest ---- */
    const source = await prisma.rankingSource.upsert({
      where: { sourceName: "Golf Digest" },
      update: {},
      create: {
        sourceName: "Golf Digest",
        sourceUrl: "https://www.golfdigest.com",
        methodologyNotes: "Golf Digest expert panel rankings of courses by state",
        authorityWeight: 0.90,
      },
    });

    /* ---- 2. Load all existing courses for fuzzy matching ---- */
    const existingCourses = await prisma.course.findMany({
      select: {
        courseId: true,
        courseName: true,
        state: true,
        city: true,
        description: true,
        accessType: true,
        originalArchitect: true,
        yearOpened: true,
        courseStyle: true,
        par: true,
        greenFeeLow: true,
        greenFeeHigh: true,
        dataSources: true,
        numListsAppeared: true,
      },
    });

    // Build normalised lookup: key → array of candidates
    const normMap = new Map<string, typeof existingCourses>();
    for (const c of existingCourses) {
      const key = normalize(c.courseName) + "|" + (c.state || "").toLowerCase();
      const arr = normMap.get(key) || [];
      arr.push(c);
      normMap.set(key, arr);
    }

    // Also build city-based fallback map
    const cityMap = new Map<string, typeof existingCourses>();
    for (const c of existingCourses) {
      const key = normalize(c.courseName);
      const arr = cityMap.get(key) || [];
      arr.push(c);
      cityMap.set(key, arr);
    }

    /* ---- 3. Process each state ---- */
    const results = {
      totalStates: data.length,
      totalCourses: 0,
      matched: 0,
      created: 0,
      rankingListsCreated: 0,
      rankingEntriesCreated: 0,
      errors: [] as string[],
      matchedNames: [] as string[],
      createdNames: [] as string[],
    };

    for (const stateData of data) {
      const stateCode = STATE_NAME_TO_CODE[stateData.state];
      if (!stateCode) {
        results.errors.push(`Unknown state: ${stateData.state}`);
        continue;
      }

      // Extract clean URL from markdown link format
      let sourceUrl = stateData.source_url || "";
      const urlMatch = sourceUrl.match(/\((https?:\/\/[^)]+)\)/);
      if (urlMatch) sourceUrl = urlMatch[1];

      /* ---- Create RankingList for this state ---- */
      const listName = `Best in ${stateData.state}`;
      const list = await prisma.rankingList.upsert({
        where: {
          sourceId_listName_cycleLabel: {
            sourceId: source.sourceId,
            listName,
            cycleLabel: "2023-24",
          },
        },
        update: {
          url: sourceUrl || undefined,
        },
        create: {
          sourceId: source.sourceId,
          listName,
          listType: "best-in-state",
          region: stateData.state,
          yearPublished: 2024,
          cycleLabel: "2023-24",
          url: sourceUrl || null,
          prestigeTier: "national",
          listWeight: 0.70,
        },
      });
      results.rankingListsCreated++;

      /* ---- Process each course in this state ---- */
      for (const gdCourse of stateData.courses) {
        results.totalCourses++;

        try {
          const courseState = cleanStateCode(gdCourse.state, stateData.state);
          const normKey = normalize(gdCourse.course_name) + "|" + courseState.toLowerCase();

          // Try exact normalised match
          let candidates = normMap.get(normKey) || [];

          // Fallback: try name-only match and filter by state proximity
          if (candidates.length === 0) {
            const nameOnly = normalize(gdCourse.course_name);
            const allByName = cityMap.get(nameOnly) || [];
            // Prefer same state
            candidates = allByName.filter(
              (c) => (c.state || "").toUpperCase() === courseState.toUpperCase()
            );
            // If still nothing and course name is very specific, accept any state match
            if (candidates.length === 0 && allByName.length === 1) {
              candidates = allByName;
            }
          }

          let courseId: number;

          if (candidates.length > 0) {
            /* ---- MATCH FOUND → enrich ---- */
            const existing = candidates[0];
            courseId = existing.courseId;

            const updateData: Record<string, unknown> = {};

            // Fill missing fields — never overwrite existing non-null values
            if (!existing.description && gdCourse.description) {
              updateData.description = gdCourse.description;
            }
            if (!existing.accessType && gdCourse.access_type) {
              updateData.accessType = normalizeAccessType(gdCourse.access_type);
            }
            if (!existing.originalArchitect && gdCourse.architect) {
              updateData.originalArchitect = gdCourse.architect;
            }
            if (!existing.yearOpened && gdCourse.year_opened) {
              const yr = parseYear(gdCourse.year_opened);
              if (yr) updateData.yearOpened = yr;
            }
            if (!existing.courseStyle && gdCourse.course_style) {
              updateData.courseStyle = gdCourse.course_style;
            }
            if (!existing.par && gdCourse.par) {
              const p = parsePar(gdCourse.par);
              if (p) updateData.par = p;
            }
            if (!existing.city && gdCourse.city) {
              updateData.city = gdCourse.city;
            }
            if (gdCourse.green_fee) {
              const fee = parseGreenFee(gdCourse.green_fee);
              if (fee) {
                if (!existing.greenFeeLow) updateData.greenFeeLow = fee;
                if (!existing.greenFeeHigh) updateData.greenFeeHigh = fee;
              }
            }

            // Update dataSources
            const sources = new Set(
              (existing.dataSources || "").split(",").filter(Boolean)
            );
            sources.add("Golf Digest");
            updateData.dataSources = Array.from(sources).join(",");

            // Increment numListsAppeared
            updateData.numListsAppeared = (existing.numListsAppeared || 0) + 1;
            updateData.updatedAt = new Date();

            await prisma.course.update({
              where: { courseId },
              data: updateData,
            });

            results.matched++;
            results.matchedNames.push(gdCourse.course_name);
          } else {
            /* ---- NO MATCH → create new course ---- */
            const par = parsePar(gdCourse.par);
            const yearOpened = parseYear(gdCourse.year_opened);
            const greenFee = parseGreenFee(gdCourse.green_fee);

            // Also try to extract par/yardage from dirty state field
            let extraPar: number | null = null;
            if (gdCourse.state && gdCourse.state.includes("par:")) {
              const m = gdCourse.state.match(/par:\s*(\d+)/);
              if (m) extraPar = parseInt(m[1], 10);
            }

            const created = await prisma.course.create({
              data: {
                courseName: gdCourse.course_name,
                city: gdCourse.city || null,
                state: courseState || null,
                country: "United States",
                accessType: normalizeAccessType(gdCourse.access_type),
                originalArchitect: gdCourse.architect || null,
                yearOpened: yearOpened,
                courseStyle: gdCourse.course_style || null,
                par: par || extraPar || null,
                description: gdCourse.description || null,
                greenFeeLow: greenFee ? greenFee : null,
                greenFeeHigh: greenFee ? greenFee : null,
                dataSources: "Golf Digest",
                numListsAppeared: 1,
                numHoles: 18,
              },
            });

            courseId = created.courseId;

            // Add to lookup for dedup within this run
            const newKey = normalize(gdCourse.course_name) + "|" + courseState.toLowerCase();
            normMap.set(newKey, [
              { ...created, dataSources: "Golf Digest", numListsAppeared: 1 } as any,
            ]);

            results.created++;
            results.createdNames.push(gdCourse.course_name);
          }

          /* ---- Create RankingEntry ---- */
          const previousRank = parsePreviousRank(gdCourse.other_details);
          const rankChange =
            previousRank && gdCourse.rank
              ? previousRank - gdCourse.rank
              : null;

          await prisma.rankingEntry.upsert({
            where: {
              listId_courseId: {
                listId: list.listId,
                courseId,
              },
            },
            update: {
              rankPosition: gdCourse.rank,
              previousRank,
              rankChange,
              notes: gdCourse.other_details || null,
            },
            create: {
              listId: list.listId,
              courseId,
              rankPosition: gdCourse.rank,
              rankTied: false,
              previousRank,
              rankChange,
              notes: gdCourse.other_details || null,
            },
          });
          results.rankingEntriesCreated++;
        } catch (err) {
          results.errors.push(
            `${gdCourse.course_name} (${stateData.state}): ${(err as Error).message}`
          );
        }
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("GD Best in State import error:", err);
    return NextResponse.json(
      { error: "Import failed", details: String(err) },
      { status: 500 }
    );
  }
}
