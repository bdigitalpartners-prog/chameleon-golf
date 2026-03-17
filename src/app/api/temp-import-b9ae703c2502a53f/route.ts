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

export async function POST(req: NextRequest) {
  const skipSubstring = req.nextUrl.searchParams.get("skipSubstring") === "true";

  try {
    const { courses } = await req.json();

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: "No courses provided" }, { status: 400 });
    }

    const existingCourses = await prisma.course.findMany({
      select: { courseId: true, courseName: true, city: true, state: true },
    });

    const exactIndex = new Map<string, (typeof existingCourses)[0]>();
    const nameOnlyIndex = new Map<string, (typeof existingCourses)[0]>();
    const byState = new Map<string, { normName: string; course: (typeof existingCourses)[0] }[]>();

    for (const ec of existingCourses) {
      const normName = normalize(ec.courseName);
      const state = (ec.state || "").toLowerCase();
      exactIndex.set(`${normName}|${state}`, ec);
      nameOnlyIndex.set(normName, ec);
      if (!byState.has(state)) byState.set(state, []);
      byState.get(state)!.push({ normName, course: ec });
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
        if (!name) { results.errors.push("Missing courseName"); results.skipped++; continue; }

        const normName = normalize(name);
        const state = (course.state || "FL").toLowerCase();
        const key = `${normName}|${state}`;

        if (exactIndex.has(key)) {
          results.duplicates.push(`${name} (exact+state: ${exactIndex.get(key)!.courseName})`);
          results.skipped++; continue;
        }

        if (nameOnlyIndex.has(normName)) {
          results.duplicates.push(`${name} (exact name: ${nameOnlyIndex.get(normName)!.courseName})`);
          results.skipped++; continue;
        }

        if (!skipSubstring && normName.length >= 8) {
          const stateEntries = byState.get(state) || [];
          let substringMatch = false;
          for (const entry of stateEntries) {
            if (entry.normName.length < 8 || entry.normName === normName) continue;
            if (entry.normName.includes(normName) || normName.includes(entry.normName)) {
              results.duplicates.push(`${name} (substring: ${entry.course.courseName})`);
              substringMatch = true; break;
            }
          }
          if (substringMatch) { results.skipped++; continue; }
        }

        const data: Record<string, unknown> = { ...course };
        for (const f of ["par", "numHoles", "yearOpened", "renovationYear"]) {
          if (data[f] != null && data[f] !== "") {
            const num = parseInt(String(data[f]));
            if (!isNaN(num)) data[f] = num; else delete data[f];
          } else delete data[f];
        }
        for (const f of ["greenFeeLow", "greenFeeHigh", "latitude", "longitude"]) {
          if (data[f] != null && data[f] !== "" && data[f] !== "Private") {
            const num = parseFloat(String(data[f]));
            if (!isNaN(num)) data[f] = num; else delete data[f];
          } else delete data[f];
        }
        if (typeof data.description === "string" && data.description.length > 1000) {
          data.description = data.description.substring(0, 997) + "...";
        }
        delete data.entity;

        await prisma.course.create({ data: data as any });
        results.created++;
        results.createdCourses.push(name);

        const newEntry = { courseId: 0, courseName: name, city: course.city, state: course.state };
        exactIndex.set(key, newEntry);
        nameOnlyIndex.set(normName, newEntry);
        if (!byState.has(state)) byState.set(state, []);
        byState.get(state)!.push({ normName, course: newEntry });
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
