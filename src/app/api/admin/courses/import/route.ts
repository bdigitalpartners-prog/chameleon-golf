import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { courses } = (await request.json()) as {
      courses: Array<Record<string, any>>;
    };

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: "courses array is required" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of courses) {
      try {
        if (!row.courseName) {
          skipped++;
          errors.push(`Row skipped: missing courseName`);
          continue;
        }

        // Check for duplicate by name + state
        const existing = await prisma.course.findFirst({
          where: {
            courseName: row.courseName,
            state: row.state || undefined,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.course.create({
          data: {
            courseName: row.courseName,
            facilityName: row.facilityName || null,
            city: row.city || null,
            state: row.state || null,
            zipCode: row.zipCode || null,
            country: row.country || "United States",
            courseType: row.courseType || null,
            accessType: row.accessType || null,
            numHoles: row.numHoles ? parseInt(row.numHoles) : 18,
            par: row.par ? parseInt(row.par) : null,
            yearOpened: row.yearOpened ? parseInt(row.yearOpened) : null,
            originalArchitect: row.originalArchitect || null,
            websiteUrl: row.websiteUrl || null,
            phone: row.phone || null,
            greenFeeLow: row.greenFeeLow ? parseFloat(row.greenFeeLow) : null,
            greenFeeHigh: row.greenFeeHigh ? parseFloat(row.greenFeeHigh) : null,
          },
        });
        created++;
      } catch (err: any) {
        errors.push(`Error on "${row.courseName}": ${err.message}`);
      }
    }

    return NextResponse.json({ created, skipped, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
