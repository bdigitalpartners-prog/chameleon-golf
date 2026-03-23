import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const handle = decodeURIComponent(params.handle);

    // Get all content by this creator (match on handle or name)
    const content = await prisma.$queryRawUnsafe(`
      SELECT cc.*, c.course_name, c.city, c.state
      FROM creator_content cc
      JOIN courses c ON c.course_id = cc.course_id
      WHERE cc.creator_handle = $1 OR LOWER(REPLACE(cc.creator_name, ' ', '-')) = LOWER($1)
      ORDER BY cc.published_at DESC NULLS LAST
    `, handle);

    const contentArr = content as any[];

    if (contentArr.length === 0) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Derive creator info from the content
    const first = contentArr[0];
    const platforms = [...new Set(contentArr.map((c: any) => c.platform))];
    const courseIds = [...new Set(contentArr.map((c: any) => c.course_id))];
    const coursesSet = [...new Set(contentArr.map((c: any) => JSON.stringify({ course_id: c.course_id, course_name: c.course_name, city: c.city, state: c.state })))].map((s: string) => JSON.parse(s));

    // Most covered courses (by content count)
    const courseCounts: Record<number, { course_name: string; city: string; state: string; course_id: number; count: number }> = {};
    for (const item of contentArr) {
      if (!courseCounts[item.course_id]) {
        courseCounts[item.course_id] = { course_name: item.course_name, city: item.city, state: item.state, course_id: item.course_id, count: 0 };
      }
      courseCounts[item.course_id].count++;
    }
    const topCourses = Object.values(courseCounts).sort((a, b) => b.count - a.count).slice(0, 10);

    const creator = {
      name: first.creator_name,
      handle: first.creator_handle || handle,
      platforms,
      totalContent: contentArr.length,
      coursesCovered: courseIds.length,
      topCourses,
    };

    return NextResponse.json({ creator, content: contentArr });
  } catch (error) {
    console.error("Error fetching creator profile:", error);
    return NextResponse.json({ error: "Failed to fetch creator profile" }, { status: 500 });
  }
}
