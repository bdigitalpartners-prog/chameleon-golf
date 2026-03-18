import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMPORT_TOKEN = "dmk-import-2026-03-18";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export async function POST(request: NextRequest) {
  const { token, courses } = await request.json();
  if (token !== IMPORT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(courses) || courses.length === 0) {
    return NextResponse.json({ error: "No courses provided" }, { status: 400 });
  }

  // Fetch all existing courses for dedup
  const existing = await prisma.course.findMany({
    select: { courseId: true, courseName: true, city: true, state: true, country: true },
  });

  const existingSet = new Map<string, { courseId: number; courseName: string }>();
  for (const e of existing) {
    const key = normalize(e.courseName);
    if (key.length >= 6) {
      existingSet.set(key, { courseId: e.courseId, courseName: e.courseName });
    }
  }

  const results = {
    created: 0,
    skipped: 0,
    updated: 0,
    errors: [] as string[],
    details: [] as { name: string; action: string; id?: number; match?: string }[],
  };

  for (const course of courses) {
    try {
      const name = course.courseName;
      if (!name) {
        results.errors.push("Missing courseName");
        results.skipped++;
        continue;
      }

      const normName = normalize(name);

      // Check for exact normalized match
      const match = existingSet.get(normName);
      if (match) {
        // Update existing course with enrichment data
        const updateData: Record<string, unknown> = {};
        const enrichFields = [
          "description", "designPhilosophy", "fairwayGrass", "greenGrass",
          "greenSpeed", "bestTimeToPlay", "golfSeason", "onSiteLodging",
          "walkingPolicy", "websiteUrl", "courseStyle", "greenFeeLow",
          "greenFeeHigh", "greenFeeCurrency", "facilityName",
        ];
        for (const field of enrichFields) {
          if (course[field] !== undefined && course[field] !== null && course[field] !== "") {
            updateData[field] = typeof course[field] === "string" && ["greenFeeLow", "greenFeeHigh"].includes(field)
              ? parseFloat(course[field])
              : course[field];
          }
        }
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          updateData.originalArchitect = course.originalArchitect || "David McLay Kidd";
          await prisma.course.update({
            where: { courseId: match.courseId },
            data: updateData as any,
          });
          results.updated++;
          results.details.push({ name, action: "updated", id: match.courseId, match: match.courseName });
        } else {
          results.skipped++;
          results.details.push({ name, action: "skipped (duplicate, no new data)", match: match.courseName });
        }
        continue;
      }

      // Also check partial match (substring) for courses with state match
      let partialMatch = false;
      for (const [key, val] of existingSet.entries()) {
        if (key.length >= 8 && normName.length >= 8) {
          if (key.includes(normName.substring(0, 8)) || normName.includes(key.substring(0, 8))) {
            // Check same state/country
            results.details.push({ name, action: "skipped (partial match)", match: val.courseName });
            partialMatch = true;
            results.skipped++;
            break;
          }
        }
      }
      if (partialMatch) continue;

      // Create new course
      const numericFields = ["par", "numHoles", "yearOpened"];
      const decimalFields = ["greenFeeLow", "greenFeeHigh", "latitude", "longitude"];

      const createData: Record<string, unknown> = { ...course };
      for (const f of numericFields) {
        if (createData[f] !== undefined) {
          const num = Number(createData[f]);
          if (!isNaN(num)) createData[f] = num;
          else delete createData[f];
        }
      }
      for (const f of decimalFields) {
        if (createData[f] !== undefined) {
          const num = parseFloat(createData[f] as string);
          if (!isNaN(num)) createData[f] = num;
          else delete createData[f];
        }
      }

      const created = await prisma.course.create({ data: createData as any });
      results.created++;
      results.details.push({ name, action: "created", id: created.courseId });
      existingSet.set(normName, { courseId: created.courseId, courseName: name });
    } catch (err) {
      results.errors.push(`${course.courseName}: ${(err as Error).message}`);
      results.skipped++;
    }
  }

  return NextResponse.json(results);
}

export async function DELETE(request: NextRequest) {
  const { token } = await request.json();
  if (token !== IMPORT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ message: "Endpoint can be safely removed" });
}
