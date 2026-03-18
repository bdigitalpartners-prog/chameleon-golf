import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const IMPORT_TOKEN = "golf-bulk-import-2026-aus-cc";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-import-token");
  if (token !== IMPORT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { courses, mode = "upsert" } = body;
    // mode: "upsert" = create new, enrich existing
    // mode: "create_only" = skip existing entirely
    // mode: "enrich_only" = only update existing, don't create new

    if (!Array.isArray(courses)) {
      return NextResponse.json({ error: "courses must be an array" }, { status: 400 });
    }

    const results: any[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const course of courses) {
      const name = course.courseName?.trim();
      if (!name) {
        results.push({ courseName: "UNKNOWN", status: "error", reason: "Missing courseName" });
        continue;
      }

      // Strict exact-name matching (normalized: lowercase, trimmed)
      const normalizedName = name.toLowerCase().replace(/['']/g, "'").replace(/[–—]/g, "-").trim();
      
      // Find existing course by exact normalized name match
      const allCourses = await prisma.course.findMany({
        where: {
          courseName: {
            mode: "insensitive",
            equals: name,
          },
        },
        select: { courseId: true, courseName: true, country: true, city: true, isEnriched: true },
      });

      // If multiple matches, prefer same country
      let existing = allCourses.length === 1
        ? allCourses[0]
        : allCourses.find((c: any) => c.country?.toLowerCase() === course.country?.toLowerCase()) || allCourses[0] || null;

      if (existing) {
        if (mode === "create_only") {
          results.push({ courseName: name, status: "skipped", reason: "Already exists", existingId: existing.courseId });
          skipped++;
          continue;
        }

        // Enrich existing course - only update fields that are null/empty
        const updateData: any = {};
        const enrichFields = [
          "facilityName", "streetAddress", "city", "state", "country",
          "courseType", "accessType", "numHoles", "par", "yearOpened",
          "courseStyle", "originalArchitect", "renovationArchitect", "renovationYear",
          "websiteUrl", "greenFeeLow", "greenFeeHigh", "greenFeeCurrency",
          "walkingPolicy", "description", "designPhilosophy",
          "fairwayGrass", "greenGrass", "greenSpeed",
          "bestTimeToPlay", "golfSeason", "onSiteLodging",
        ];

        // Get full existing record
        const fullExisting = await prisma.course.findUnique({
          where: { courseId: existing.courseId },
        });

        for (const field of enrichFields) {
          if (course[field] !== undefined && course[field] !== null) {
            const existingVal = (fullExisting as any)?.[field];
            // Update if existing value is null/empty, or if this is a richer description
            if (existingVal === null || existingVal === undefined || existingVal === "" ||
                (field === "description" && course[field]?.length > (existingVal?.length || 0))) {
              updateData[field] = course[field];
            }
          }
        }

        if (Object.keys(updateData).length > 0) {
          updateData.isEnriched = true;
          updateData.updatedAt = new Date();
          await prisma.course.update({
            where: { courseId: existing.courseId },
            data: updateData,
          });
          results.push({ courseName: name, status: "enriched", id: existing.courseId, fieldsUpdated: Object.keys(updateData).filter(k => k !== "isEnriched" && k !== "updatedAt") });
          updated++;
        } else {
          results.push({ courseName: name, status: "skipped", reason: "Already fully enriched", existingId: existing.courseId });
          skipped++;
        }
      } else {
        if (mode === "enrich_only") {
          results.push({ courseName: name, status: "skipped", reason: "Not found in DB (enrich_only mode)" });
          skipped++;
          continue;
        }

        // Create new course
        const createData: any = {
          courseName: name,
          country: course.country || "United States",
          isEnriched: true,
        };

        const createFields = [
          "facilityName", "streetAddress", "city", "state", "zipCode",
          "courseType", "accessType", "numHoles", "par", "yearOpened",
          "courseStyle", "originalArchitect", "renovationArchitect", "renovationYear",
          "websiteUrl", "phone", "greenFeeLow", "greenFeeHigh", "greenFeeCurrency",
          "walkingPolicy", "description", "designPhilosophy",
          "fairwayGrass", "greenGrass", "greenSpeed",
          "bestTimeToPlay", "golfSeason", "onSiteLodging",
        ];

        for (const field of createFields) {
          if (course[field] !== undefined && course[field] !== null) {
            createData[field] = course[field];
          }
        }

        const newCourse = await prisma.course.create({ data: createData });
        results.push({ courseName: name, status: "created", id: newCourse.courseId });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: courses.length, created, updated, skipped },
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack?.split("\n").slice(0, 3) }, { status: 500 });
  }
}

// GET endpoint to check existing courses and count
export async function GET(request: NextRequest) {
  const token = request.headers.get("x-import-token");
  if (token !== IMPORT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "count") {
    const count = await prisma.course.count();
    return NextResponse.json({ totalCourses: count });
  }

  if (action === "search") {
    const name = url.searchParams.get("name");
    if (!name) return NextResponse.json({ error: "name param required" }, { status: 400 });
    
    const matches = await prisma.course.findMany({
      where: {
        courseName: { mode: "insensitive", contains: name },
      },
      select: { courseId: true, courseName: true, city: true, state: true, country: true, originalArchitect: true, isEnriched: true },
      take: 20,
    });
    return NextResponse.json({ matches });
  }

  if (action === "list_country") {
    const country = url.searchParams.get("country") || "Australia";
    const courses = await prisma.course.findMany({
      where: { country: { mode: "insensitive", equals: country } },
      select: { courseId: true, courseName: true, city: true, state: true, originalArchitect: true },
      orderBy: { courseName: "asc" },
    });
    return NextResponse.json({ country, count: courses.length, courses });
  }

  return NextResponse.json({ status: "ready", info: "Use ?action=count|search|list_country" });
}
