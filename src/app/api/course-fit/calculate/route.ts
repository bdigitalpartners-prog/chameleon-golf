import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateCourseFitScore } from "@/lib/course-fit";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);

  try {
    const profiles = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM user_golf_profile WHERE user_id = $1 LIMIT 1`,
      userId
    );

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Golf profile not found" }, { status: 404 });
    }

    const profile = profiles[0];

    const courses = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "courseId", "courseStyle", "accessType", "greenFeeLow", "greenFeeHigh",
              "walkingPolicy", "latitude", "longitude", "par", "numHoles"
       FROM courses
       LIMIT 500`
    );

    let calculated = 0;
    for (const course of courses) {
      const { fit_score, breakdown } = calculateCourseFitScore(profile, course);

      await prisma.$queryRawUnsafe(
        `INSERT INTO course_fit_scores (user_id, course_id, fit_score, breakdown, calculated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, course_id) DO UPDATE SET
           fit_score = EXCLUDED.fit_score,
           breakdown = EXCLUDED.breakdown,
           calculated_at = NOW()`,
        userId,
        course.courseId,
        fit_score,
        JSON.stringify(breakdown)
      );
      calculated++;
    }

    return NextResponse.json({ success: true, calculated });
  } catch (err) {
    console.error("Error calculating fit scores:", err);
    return NextResponse.json({ error: "Failed to calculate scores" }, { status: 500 });
  }
}
