import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Get walking policy for a course
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 }
    );
  }

  try {
    const policies = await prisma.$queryRawUnsafe<any[]>(
      `SELECT wp.*,
              c."courseName" as course_name,
              c."city", c."state"
       FROM course_walking_policy wp
       LEFT JOIN courses c ON c."courseId" = wp.course_id
       WHERE wp.course_id = $1
       LIMIT 1`,
      Number(courseId)
    );

    if (policies.length === 0) {
      return NextResponse.json(
        { error: "Walking policy not found for this course" },
        { status: 404 }
      );
    }

    return NextResponse.json({ policy: policies[0] });
  } catch (error) {
    console.error("GET /api/walking-policy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch walking policy" },
      { status: 500 }
    );
  }
}
