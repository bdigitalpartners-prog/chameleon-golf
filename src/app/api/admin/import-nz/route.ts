import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const IMPORT_TOKEN = "NZImport2026!";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`\-]/g, "")
    .replace(
      /\b(the|at|of|and|&|golf|course|club|links|resort|country)\b/gi,
      ""
    )
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function truncate(val: string | undefined | null, maxLen: number): string | undefined {
  if (!val) return undefined;
  return val.length > maxLen ? val.slice(0, maxLen) : val;
}

function toInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : Math.round(n);
}

function toDecimal(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = parseFloat(String(val));
  return isNaN(n) ? undefined : n;
}

export async function POST(request: NextRequest) {
  // Token auth
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${IMPORT_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const courses = await request.json();

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { error: "Request body must be a non-empty array of course objects" },
        { status: 400 }
      );
    }

    // Fetch all existing NZ courses for dedup
    const existingCourses = await prisma.course.findMany({
      where: { country: "New Zealand" },
      select: { courseId: true, courseName: true },
    });

    const existingNormalized = existingCourses.map((c) => ({
      courseId: c.courseId,
      normalized: normalize(c.courseName),
    }));

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      createdCourses: [] as string[],
      skippedCourses: [] as string[],
    };

    // Track in-batch dedup
    const batchNormalized = new Set<string>();

    for (let i = 0; i < courses.length; i++) {
      const row = courses[i];
      try {
        if (!row.courseName) {
          results.errors.push(`Row ${i + 1}: Missing courseName`);
          results.skipped++;
          continue;
        }

        const norm = normalize(row.courseName);

        // In-batch dedup
        if (batchNormalized.has(norm)) {
          results.skippedCourses.push(`${row.courseName} (batch duplicate)`);
          results.skipped++;
          continue;
        }

        // DB dedup: require normalized name >= 8 chars to avoid false positives
        if (norm.length >= 8) {
          const isDuplicate = existingNormalized.some(
            (existing) =>
              existing.normalized.includes(norm) ||
              norm.includes(existing.normalized)
          );
          if (isDuplicate) {
            results.skippedCourses.push(
              `${row.courseName} (duplicate in DB)`
            );
            results.skipped++;
            continue;
          }
        }

        batchNormalized.add(norm);

        await prisma.course.create({
          data: {
            courseName: truncate(row.courseName, 255)!,
            facilityName: truncate(row.facilityName, 255),
            streetAddress: truncate(row.streetAddress, 255),
            city: truncate(row.city, 100),
            state: truncate(row.state, 100),
            country: row.country || "New Zealand",
            phone: truncate(row.phone, 50),
            websiteUrl: truncate(row.websiteUrl, 500),
            originalArchitect: truncate(row.originalArchitect, 255),
            yearOpened: toInt(row.yearOpened),
            numHoles: toInt(row.numHoles),
            par: toInt(row.par),
            accessType: truncate(row.accessType, 50),
            courseType: truncate(row.courseType, 50),
            greenFeeLow: toDecimal(row.greenFeeLow),
            greenFeeHigh: toDecimal(row.greenFeeHigh),
            greenFeeCurrency: truncate(row.greenFeeCurrency, 3),
            description: row.description || undefined,
            dataSources: truncate(row.dataSources, undefined),
          },
        });

        results.created++;
        results.createdCourses.push(row.courseName);
      } catch (err) {
        results.errors.push(
          `Row ${i + 1} (${row.courseName}): ${(err as Error).message}`
        );
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("NZ import error:", err);
    return NextResponse.json(
      { error: "Import failed: " + (err as Error).message },
      { status: 500 }
    );
  }
}
