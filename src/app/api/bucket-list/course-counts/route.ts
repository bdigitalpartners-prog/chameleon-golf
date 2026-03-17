import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const courseId = parseInt(req.nextUrl.searchParams.get("courseId") ?? "");
    if (isNaN(courseId)) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    const [bucketList, played] = await Promise.all([
      prisma.bucketListItem.count({ where: { courseId } }),
      prisma.bucketListItem.count({ where: { courseId, status: "Played" } }),
    ]);

    return NextResponse.json({ bucketList, played });
  } catch (error) {
    console.error("[BucketList CourseCounts]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
