import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authErr = await checkAdminAuth(request);
  if (authErr) return authErr;

  try {
    const { courses, columnMap } = await request.json();

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: "No courses data provided" }, { status: 400 });
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < courses.length; i++) {
      const row = courses[i];
      try {
        // Map CSV columns to course fields
        const data: Record<string, unknown> = {};
        if (columnMap) {
          for (const [csvCol, dbField] of Object.entries(columnMap)) {
            if (dbField && row[csvCol] !== undefined && row[csvCol] !== "") {
              data[dbField as string] = row[csvCol];
            }
          }
        } else {
          Object.assign(data, row);
        }

        // Ensure required field
        if (!data.courseName) {
          results.errors.push(`Row ${i + 1}: Missing courseName`);
          results.skipped++;
          continue;
        }

        // Convert numeric fields
        const numericFields = ["par", "numHoles", "yearOpened", "greenFeeLow", "greenFeeLow"];
        for (const f of numericFields) {
          if (data[f] !== undefined) {
            const num = Number(data[f]);
            if (!isNaN(num)) data[f] = num;
            else delete data[f];
          }
        }

        // Convert decimal fields
        const decimalFields = ["latitude", "longitude"];
        for (const f of decimalFields) {
          if (data[f] !== undefined) {
            const num = parseFloat(data[f] as string);
            if (!isNaN(num)) data[f] = num;
            else delete data[f];
          }
        }

        await prisma.course.create({ data: data as any });
        results.created++;
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${(err as Error).message}`);
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
