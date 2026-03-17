import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

interface CourseInput {
  courseName: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  streetAddress?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  accessType?: string | null;
  courseType?: string | null;
  par?: number | null;
  numHoles?: number | null;
  yearOpened?: number | null;
  originalArchitect?: string | null;
  renovationArchitect?: string | null;
  renovationYear?: number | null;
  description?: string | null;
  greenFeeLow?: number | null;
  greenFeeHigh?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

function cleanString(val: unknown, maxLen?: number): string | null {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  // Remove markdown links
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Clean null-like values
  if (/^(null|n\/a|unknown|not specified|none|-)$/i.test(s) || s === "") return null;
  if (maxLen) s = s.slice(0, maxLen);
  return s;
}

function cleanNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const courses: CourseInput[] = body.courses;

    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json({ error: "Missing courses array" }, { status: 400 });
    }

    const skipSubstring = request.nextUrl.searchParams.get("skipSubstring") === "true";

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      duplicates: [] as string[],
    };

    for (const c of courses) {
      try {
        const name = cleanString(c.courseName, 255);
        if (!name) {
          results.errors.push(`Missing courseName for entry`);
          continue;
        }

        // Dedup: exact name match (case-insensitive)
        const existingExact = await prisma.course.findFirst({
          where: { courseName: { equals: name, mode: "insensitive" } },
        });
        if (existingExact) {
          results.duplicates.push(`${name} (exact match)`);
          results.skipped++;
          continue;
        }

        // Dedup: substring match unless skipSubstring is set
        if (!skipSubstring) {
          const existingSub = await prisma.course.findFirst({
            where: {
              OR: [
                { courseName: { contains: name, mode: "insensitive" } },
                {
                  courseName: {
                    in: [name],
                    mode: "insensitive",
                  },
                },
              ],
            },
          });
          if (existingSub) {
            results.duplicates.push(`${name} (substring of ${existingSub.courseName})`);
            results.skipped++;
            continue;
          }
        }

        await prisma.course.create({
          data: {
            courseName: name,
            city: cleanString(c.city, 100),
            state: cleanString(c.state, 100) || "FL",
            country: cleanString(c.country, 100) || "United States",
            streetAddress: cleanString(c.streetAddress, 255),
            zipCode: cleanString(c.zipCode, 20),
            phone: cleanString(c.phone, 50),
            websiteUrl: cleanString(c.websiteUrl, 500),
            accessType: cleanString(c.accessType, 50),
            courseType: cleanString(c.courseType, 50),
            par: cleanNumber(c.par),
            numHoles: cleanNumber(c.numHoles) || 18,
            yearOpened: cleanNumber(c.yearOpened),
            originalArchitect: cleanString(c.originalArchitect, 255),
            renovationArchitect: cleanString(c.renovationArchitect, 255),
            renovationYear: cleanNumber(c.renovationYear),
            description: cleanString(c.description, 1000),
            greenFeeLow: c.greenFeeLow != null ? cleanNumber(c.greenFeeLow) : null,
            greenFeeHigh: c.greenFeeHigh != null ? cleanNumber(c.greenFeeHigh) : null,
            greenFeeCurrency: "USD",
          },
        });
        results.created++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`${c.courseName}: ${msg}`);
      }
    }

    return NextResponse.json({
      total: courses.length,
      ...results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
