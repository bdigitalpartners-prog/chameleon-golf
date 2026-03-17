import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/golf club|golf course|country club|golf links|golf & country club|resort|hotel|the /gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * POST /api/temp-import-b9ae703c2502a53f
 * Temporary one-time bulk import with dedup. Remove after use.
 */
export async function POST(req: NextRequest) {
  try {
    const { courses } = await req.json();

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: "No courses provided" }, { status: 400 });
    }

    // Get ALL existing courses for dedup
    const existingCourses = await prisma.course.findMany({
      select: { courseId: true, courseName: true, city: true, state: true },
    });

    // Build dedup index: normalized name -> course
    const existingIndex = new Map<string, (typeof existingCourses)[0]>();
    for (const ec of existingCourses) {
      const key = `${normalize(ec.courseName)}|${(ec.state || "").toLowerCase()}`;
      existingIndex.set(key, ec);
      // Also index by name without state
      existingIndex.set(normalize(ec.courseName), ec);
    }

    const results = {
      total: courses.length,
      created: 0,
      skipped: 0,
      duplicates: [] as string[],
      errors: [] as string[],
      createdCourses: [] as string[],
    };

    for (const course of courses) {
      try {
        const name = course.courseName || "";
        if (!name) {
          results.errors.push("Missing courseName");
          results.skipped++;
          continue;
        }

        const normName = normalize(name);
        const state = (course.state || "FL").toLowerCase();
        const key = `${normName}|${state}`;

        // Check exact normalized match
        const existing = existingIndex.get(key) || existingIndex.get(normName);

        // Also check substring matching
        let substringMatch = false;
        let substringMatchName = "";
        for (const [existKey, existCourse] of existingIndex) {
          if (existKey.includes("|")) continue;
          if (
            (existKey.includes(normName) || normName.includes(existKey)) &&
            existKey.length > 3
          ) {
            substringMatch = true;
            substringMatchName = existCourse.courseName;
            break;
          }
        }

        if (existing) {
          results.duplicates.push(`${name} (exact match: ${existing.courseName})`);
          results.skipped++;
          continue;
        }

        if (substringMatch) {
          results.duplicates.push(`${name} (substring match: ${substringMatchName})`);
          results.skipped++;
          continue;
        }

        // Clean numeric fields
        const data: Record<string, unknown> = { ...course };
        const intFields = ["par", "numHoles", "yearOpened", "renovationYear"];
        for (const f of intFields) {
          if (data[f] !== undefined && data[f] !== null && data[f] !== "") {
            const num = parseInt(String(data[f]));
            if (!isNaN(num)) data[f] = num;
            else delete data[f];
          } else {
            delete data[f];
          }
        }

        const decimalFields = ["greenFeeLow", "greenFeeHigh", "latitude", "longitude"];
        for (const f of decimalFields) {
          if (
            data[f] !== undefined &&
            data[f] !== null &&
            data[f] !== "" &&
            data[f] !== "Private"
          ) {
            const num = parseFloat(String(data[f]));
            if (!isNaN(num)) data[f] = num;
            else delete data[f];
          } else {
            delete data[f];
          }
        }

        // Remove non-schema fields
        delete data.entity;

        await prisma.course.create({ data: data as any });
        results.created++;
        results.createdCourses.push(name);

        // Prevent in-batch duplicates
        existingIndex.set(key, {
          courseId: 0,
          courseName: name,
          city: course.city,
          state: course.state,
        });
        existingIndex.set(normName, {
          courseId: 0,
          courseName: name,
          city: course.city,
          state: course.state,
        });
      } catch (err: any) {
        results.errors.push(`${course.courseName}: ${err.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
