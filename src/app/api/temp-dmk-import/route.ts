import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMPORT_TOKEN = "dmk-import-2026-03-18";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const { token, courses, mode } = await request.json();
  if (token !== IMPORT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(courses) || courses.length === 0) {
    return NextResponse.json({ error: "No courses provided" }, { status: 400 });
  }

  // mode = "force_create" bypasses dedup and creates all courses
  // mode = "enrich" updates existing courses by ID
  // default = create with strict exact-name dedup only

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    details: [] as { name: string; action: string; id?: number; match?: string }[],
  };

  if (mode === "enrich") {
    // Update existing courses by courseId
    for (const course of courses) {
      try {
        const { courseId, ...updateData } = course;
        if (!courseId) {
          results.errors.push(`Missing courseId for enrichment`);
          results.skipped++;
          continue;
        }
        const numericFields = ["par", "numHoles", "yearOpened"];
        const decimalFields = ["greenFeeLow", "greenFeeHigh", "latitude", "longitude"];
        for (const f of numericFields) {
          if (updateData[f] !== undefined) {
            const num = Number(updateData[f]);
            if (!isNaN(num)) updateData[f] = num;
            else delete updateData[f];
          }
        }
        for (const f of decimalFields) {
          if (updateData[f] !== undefined) {
            const num = parseFloat(updateData[f]);
            if (!isNaN(num)) updateData[f] = num;
            else delete updateData[f];
          }
        }
        updateData.updatedAt = new Date();
        await prisma.course.update({ where: { courseId }, data: updateData });
        results.updated++;
        results.details.push({ name: course.courseName || `ID:${courseId}`, action: "enriched", id: courseId });
      } catch (err) {
        results.errors.push(`ID ${course.courseId}: ${(err as Error).message}`);
        results.skipped++;
      }
    }
    return NextResponse.json(results);
  }

  // Force create or strict dedup
  let existingNames: Set<string> = new Set();
  if (mode !== "force_create") {
    const existing = await prisma.course.findMany({
      select: { courseName: true },
    });
    existingNames = new Set(existing.map((e) => normalize(e.courseName)));
  }

  for (const course of courses) {
    try {
      const name = course.courseName;
      if (!name) {
        results.errors.push("Missing courseName");
        results.skipped++;
        continue;
      }

      // Strict exact-name dedup only
      if (existingNames.has(normalize(name))) {
        results.skipped++;
        results.details.push({ name, action: "skipped (exact name exists)" });
        continue;
      }

      const createData: Record<string, unknown> = { ...course };
      const numericFields = ["par", "numHoles", "yearOpened"];
      const decimalFields = ["greenFeeLow", "greenFeeHigh", "latitude", "longitude"];
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
      existingNames.add(normalize(name));
    } catch (err) {
      results.errors.push(`${course.courseName}: ${(err as Error).message}`);
      results.skipped++;
    }
  }

  return NextResponse.json(results);
}
