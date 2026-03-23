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
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const style = searchParams.get("style");
  const region = searchParams.get("region");
  const sortBy = searchParams.get("sortBy") || "fit_score";

  try {
    // Get user profile
    const profiles = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM user_golf_profile WHERE user_id = $1 LIMIT 1`,
      userId
    );

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Golf profile not found" }, { status: 404 });
    }

    // Check for cached scores
    const cachedScores = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cfs.*, c."courseName", c."city", c."state", c."country", c."courseStyle",
              c."accessType", c."greenFeeLow", c."greenFeeHigh", c."logoUrl",
              c."originalArchitect", c."walkingPolicy"
       FROM course_fit_scores cfs
       JOIN courses c ON c."courseId" = cfs.course_id
       WHERE cfs.user_id = $1
       ORDER BY cfs.fit_score DESC
       LIMIT $2`,
      userId,
      limit
    );

    if (cachedScores.length >= limit) {
      let results = cachedScores.map((s: any) => ({
        courseId: s.course_id,
        name: s.courseName,
        location: [s.city, s.state, s.country].filter(Boolean).join(", "),
        style: s.courseStyle,
        accessType: s.accessType,
        greenFee: s.greenFeeLow ? `$${s.greenFeeLow}${s.greenFeeHigh ? `–$${s.greenFeeHigh}` : ""}` : "N/A",
        architect: s.originalArchitect,
        logoUrl: s.logoUrl,
        fit_score: s.fit_score,
        breakdown: s.breakdown ? JSON.parse(s.breakdown) : null,
      }));

      if (style) results = results.filter((r: any) => r.style?.toLowerCase().includes(style.toLowerCase()));
      if (region) results = results.filter((r: any) => r.location?.toLowerCase().includes(region.toLowerCase()));

      return NextResponse.json({ courses: results });
    }

    // Calculate on the fly for all courses
    const profile = profiles[0];
    let whereClause = "1=1";
    const params: any[] = [];

    if (style) {
      params.push(`%${style}%`);
      whereClause += ` AND c."courseStyle" ILIKE $${params.length}`;
    }
    if (region) {
      params.push(`%${region}%`);
      whereClause += ` AND (c."state" ILIKE $${params.length} OR c."country" ILIKE $${params.length})`;
    }

    const courses = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "courseId", "courseName", "city", "state", "country", "courseStyle",
              "accessType", "greenFeeLow", "greenFeeHigh", "walkingPolicy",
              "latitude", "longitude", "par", "logoUrl", "originalArchitect", "numHoles"
       FROM courses c
       WHERE ${whereClause}
       LIMIT 200`,
      ...params
    );

    const scored = courses.map((c: any) => {
      const { fit_score, breakdown } = calculateCourseFitScore(profile, c);
      return {
        courseId: c.courseId,
        name: c.courseName,
        location: [c.city, c.state, c.country].filter(Boolean).join(", "),
        style: c.courseStyle,
        accessType: c.accessType,
        greenFee: c.greenFeeLow ? `$${c.greenFeeLow}${c.greenFeeHigh ? `–$${c.greenFeeHigh}` : ""}` : "N/A",
        architect: c.originalArchitect,
        logoUrl: c.logoUrl,
        fit_score,
        breakdown,
      };
    });

    scored.sort((a, b) => b.fit_score - a.fit_score);
    const topCourses = scored.slice(0, limit);

    return NextResponse.json({ courses: topCourses });
  } catch (err) {
    console.error("Error fetching top courses:", err);
    return NextResponse.json({ error: "Failed to fetch top courses" }, { status: 500 });
  }
}
