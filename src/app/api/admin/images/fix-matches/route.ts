import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Correction {
  wrong_id: number;
  correct_id: number;
  gd_name: string;
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { corrections } = await request.json() as { corrections: Correction[] };
    
    if (!Array.isArray(corrections)) {
      return NextResponse.json({ error: "Expected corrections array" }, { status: 400 });
    }

    const results: { gd_name: string; status: string; detail?: string }[] = [];

    for (const corr of corrections) {
      // Find the Golf Digest media record on the wrong course
      const wrongMedia = await prisma.courseMedia.findFirst({
        where: {
          courseId: corr.wrong_id,
          sourceName: "Golf Digest",
        },
      });

      if (!wrongMedia) {
        results.push({ gd_name: corr.gd_name, status: "not_found", detail: `No Golf Digest media on course ${corr.wrong_id}` });
        continue;
      }

      // Check if correct course already has a Golf Digest image
      const existingOnCorrect = await prisma.courseMedia.findFirst({
        where: {
          courseId: corr.correct_id,
          sourceName: "Golf Digest",
        },
      });

      if (existingOnCorrect) {
        // Delete the wrong one, correct already exists
        await prisma.courseMedia.delete({ where: { mediaId: wrongMedia.mediaId } });
        results.push({ gd_name: corr.gd_name, status: "deleted_duplicate", detail: `Deleted from ${corr.wrong_id}, already existed on ${corr.correct_id}` });
        continue;
      }

      // Move the record to the correct course
      await prisma.courseMedia.update({
        where: { mediaId: wrongMedia.mediaId },
        data: { courseId: corr.correct_id },
      });

      results.push({ gd_name: corr.gd_name, status: "moved", detail: `Moved from ${corr.wrong_id} to ${corr.correct_id}` });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Fix matches error:", err);
    return NextResponse.json({ error: "Failed to fix matches", details: String(err) }, { status: 500 });
  }
}
