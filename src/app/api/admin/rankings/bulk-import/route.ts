import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Temporary bulk import endpoint for ranking entries.
 * POST /api/admin/rankings/bulk-import
 * Body: { listId: number, entries: Array<{ courseId: number, rankPosition: number }>, secret: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, entries, secret } = body;

    // Simple secret check - this is a temporary endpoint
    if (secret !== "golfEQ-bulk-import-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!listId || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "listId and entries[] are required" }, { status: 400 });
    }

    let success = 0;
    const errors: Array<{ rank: number; error: string }> = [];

    for (const entry of entries) {
      try {
        await prisma.rankingEntry.create({
          data: {
            listId,
            courseId: entry.courseId,
            rankPosition: entry.rankPosition,
            rankTied: false,
          },
        });
        success++;
      } catch (err: any) {
        if (err?.code === "P2002") {
          errors.push({ rank: entry.rankPosition, error: "Duplicate entry" });
        } else if (err?.code === "P2003") {
          errors.push({ rank: entry.rankPosition, error: "Course not found in DB" });
        } else {
          errors.push({ rank: entry.rankPosition, error: err.message || "Unknown error" });
        }
      }
    }

    // Count total after import
    const totalCount = await prisma.rankingEntry.count({ where: { listId } });

    return NextResponse.json({
      success,
      errorCount: errors.length,
      errors,
      totalEntriesInList: totalCount,
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
