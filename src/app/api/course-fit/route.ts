import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateCourseFitScore } from "@/lib/course-fit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  try {
    // Check for cached score
    const cached = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM course_fit_scores WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
      userId,
      parseInt(courseId)
    );

    if (cached.length > 0) {
      return NextResponse.json({
        fit_score: cached[0].fit_score,
        breakdown: cached[0].breakdown ? JSON.parse(cached[0].breakdown) : null,
        calculated_at: cached[0].calculated_at,
      });
    }

    // Calculate on-the-fly
    const profiles = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM user_golf_profile WHERE user_id = $1 LIMIT 1`,
      userId
    );

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Golf profile not found. Please set up your profile first." }, { status: 404 });
    }

    const courses = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "courseId", "courseStyle", "accessType", "greenFeeLow", "greenFeeHigh",
              "walkingPolicy", "latitude", "longitude", "par", "numHoles"
       FROM courses WHERE "courseId" = $1 LIMIT 1`,
      parseInt(courseId)
    );

    if (courses.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const profile = profiles[0];
    const course = courses[0];
    const { fit_score, breakdown } = calculateCourseFitScore(profile, course);

    // Cache the result
    await prisma.$queryRawUnsafe(
      `INSERT INTO course_fit_scores (user_id, course_id, fit_score, breakdown, calculated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, course_id) DO UPDATE SET
         fit_score = EXCLUDED.fit_score,
         breakdown = EXCLUDED.breakdown,
         calculated_at = NOW()`,
      userId,
      parseInt(courseId),
      fit_score,
      JSON.stringify(breakdown)
    );

    return NextResponse.json({ fit_score, breakdown });
  } catch (err) {
    console.error("Error calculating course fit:", err);
    return NextResponse.json({ error: "Failed to calculate course fit" }, { status: 500 });
  }
}
