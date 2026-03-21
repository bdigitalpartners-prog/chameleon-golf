import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

/**
 * Bulk enrichment endpoint — accepts an array of course updates.
 * POST /api/admin/enrich
 * Body: { courses: [{ courseId: number, ...fieldsToUpdate }] }
 * Auth: x-admin-key header (env var or hardcoded fallback) or admin session
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const courses: Record<string, any>[] = body.courses;

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { error: "courses array required" },
        { status: 400 }
      );
    }

    // Cap batch size at 100 per request
    if (courses.length > 100) {
      return NextResponse.json(
        { error: "Max 100 courses per batch" },
        { status: 400 }
      );
    }

    const results: { courseId: number; status: string; error?: string }[] = [];

    for (const course of courses) {
      const { courseId, ...data } = course;
      if (!courseId) {
        results.push({ courseId: 0, status: "skipped", error: "no courseId" });
        continue;
      }

      try {
        // Set updatedAt to now
        data.updatedAt = new Date();

        await prisma.course.update({
          where: { courseId: Number(courseId) },
          data,
        });
        results.push({ courseId, status: "updated" });
      } catch (err: any) {
        results.push({ courseId, status: "error", error: err.message });
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      total: courses.length,
      updated,
      errors,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/enrich — Get enrichment stats
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  // Get field-level enrichment stats
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(*) as total_courses,
      COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as has_description,
      COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as has_coordinates,
      COUNT(CASE WHEN street_address IS NOT NULL THEN 1 END) as has_address,
      COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as has_phone,
      COUNT(CASE WHEN website_url IS NOT NULL THEN 1 END) as has_website,
      COUNT(CASE WHEN par IS NOT NULL THEN 1 END) as has_par,
      COUNT(CASE WHEN year_opened IS NOT NULL THEN 1 END) as has_year,
      COUNT(CASE WHEN original_architect IS NOT NULL THEN 1 END) as has_architect,
      COUNT(CASE WHEN course_type IS NOT NULL THEN 1 END) as has_course_type,
      COUNT(CASE WHEN access_type IS NOT NULL THEN 1 END) as has_access_type,
      COUNT(CASE WHEN course_style IS NOT NULL THEN 1 END) as has_course_style,
      COUNT(CASE WHEN green_fee_low IS NOT NULL THEN 1 END) as has_green_fees,
      COUNT(CASE WHEN walking_policy IS NOT NULL THEN 1 END) as has_walking_policy,
      COUNT(CASE WHEN logo_url IS NOT NULL THEN 1 END) as has_logo,
      COUNT(CASE WHEN insider_tips IS NOT NULL THEN 1 END) as has_insider_tips,
      COUNT(CASE WHEN weather_data IS NOT NULL THEN 1 END) as has_weather,
      COUNT(CASE WHEN best_time_to_play IS NOT NULL THEN 1 END) as has_best_time,
      COUNT(CASE WHEN what_to_expect IS NOT NULL THEN 1 END) as has_what_to_expect,
      COUNT(CASE WHEN course_strategy IS NOT NULL THEN 1 END) as has_strategy,
      COUNT(CASE WHEN championship_history IS NOT NULL THEN 1 END) as has_championship,
      COUNT(CASE WHEN architect_bio IS NOT NULL THEN 1 END) as has_architect_bio,
      COUNT(CASE WHEN is_enriched = true THEN 1 END) as marked_enriched,
      COUNT(CASE WHEN is_verified = true THEN 1 END) as marked_verified
    FROM courses
  `;

  // Nearby data counts
  const relatedStats = await prisma.$queryRaw<any[]>`
    SELECT
      (SELECT COUNT(DISTINCT course_id) FROM course_airport_proximity) as courses_with_airports,
      (SELECT COUNT(DISTINCT course_id) FROM course_nearby_dining) as courses_with_dining,
      (SELECT COUNT(DISTINCT course_id) FROM course_nearby_lodging) as courses_with_lodging,
      (SELECT COUNT(DISTINCT course_id) FROM course_nearby_attractions) as courses_with_attractions,
      (SELECT COUNT(*) FROM course_media) as total_media,
      (SELECT COUNT(DISTINCT course_id) FROM course_media) as courses_with_media,
      (SELECT COUNT(*) FROM tee_boxes) as total_tee_boxes,
      (SELECT COUNT(DISTINCT course_id) FROM tee_boxes) as courses_with_tee_boxes,
      (SELECT COUNT(*) FROM holes) as total_holes,
      (SELECT COUNT(DISTINCT course_id) FROM holes) as courses_with_holes
  `;

  return NextResponse.json({
    fieldStats: stats[0],
    relatedStats: relatedStats[0],
  });
}
