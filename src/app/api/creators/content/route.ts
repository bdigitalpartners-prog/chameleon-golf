import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const content = await prisma.$queryRawUnsafe(`
      SELECT cc.*, c.course_name, c.city, c.state
      FROM creator_content cc
      JOIN courses c ON c.course_id = cc.course_id
      WHERE cc.course_id = $1
      ORDER BY cc.published_at DESC NULLS LAST
    `, parseInt(courseId));

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching creator content:", error);
    return NextResponse.json({ error: "Failed to fetch creator content" }, { status: 500 });
  }
}
