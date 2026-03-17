import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import {
  enrichCourse,
  calculateEnrichmentPct,
  ENRICHMENT_FIELDS,
  type CourseData,
} from "@/lib/course-enrichment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/enrich-smart
 *
 * Smart enrichment: analyzes existing course data (descriptions, location)
 * and extracts/generates structured fields.
 *
 * Body: { courseIds?: number[], limit?: number, dryRun?: boolean }
 * - courseIds: specific courses to enrich (max 200)
 * - limit: if no courseIds, enrich up to this many un-enriched courses
 * - dryRun: if true, return what would be enriched without writing
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { courseIds, limit = 50, dryRun = false } = body;

    // Fetch courses to enrich
    const where: any = {};
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      if (courseIds.length > 200) {
        return NextResponse.json(
          { error: "Max 200 courseIds per request" },
          { status: 400 }
        );
      }
      where.courseId = { in: courseIds.map(Number) };
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        courseId: true,
        courseName: true,
        description: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        par: true,
        yearOpened: true,
        originalArchitect: true,
        courseType: true,
        accessType: true,
        courseStyle: true,
        greenFeeLow: true,
        greenFeeHigh: true,
        walkingPolicy: true,
        dressCode: true,
        caddieAvailability: true,
        practiceFacilities: true,
        bestTimeToPlay: true,
        bestMonths: true,
        averageRoundTime: true,
        golfSeason: true,
        numHoles: true,
        fairwayGrass: true,
        greenGrass: true,
      },
      take: courseIds ? undefined : Math.min(limit, 200),
      orderBy: { courseId: "asc" },
    });

    const results: {
      courseId: number;
      courseName: string;
      fieldsEnriched: number;
      extractedFrom: string[];
      beforePct: number;
      afterPct: number;
      status: string;
      error?: string;
    }[] = [];

    let totalFieldsEnriched = 0;

    for (const raw of courses) {
      // Serialize Decimals
      const course: CourseData = {
        ...raw,
        latitude: raw.latitude ? Number(raw.latitude) : null,
        longitude: raw.longitude ? Number(raw.longitude) : null,
        greenFeeLow: raw.greenFeeLow ? Number(raw.greenFeeLow) : null,
        greenFeeHigh: raw.greenFeeHigh ? Number(raw.greenFeeHigh) : null,
      };

      const beforePct = calculateEnrichmentPct(course as any);
      const enrichment = enrichCourse(course);
      const fieldCount = Object.keys(enrichment.fields).length;

      if (fieldCount === 0) {
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          fieldsEnriched: 0,
          extractedFrom: [],
          beforePct,
          afterPct: beforePct,
          status: "no_changes",
        });
        continue;
      }

      // Calculate after pct
      const afterCourse = { ...course, ...enrichment.fields };
      const afterPct = calculateEnrichmentPct(afterCourse as any);

      if (!dryRun) {
        try {
          await prisma.course.update({
            where: { courseId: course.courseId },
            data: {
              ...enrichment.fields,
              updatedAt: new Date(),
            },
          });

          results.push({
            courseId: course.courseId,
            courseName: course.courseName,
            fieldsEnriched: fieldCount,
            extractedFrom: enrichment.extractedFrom,
            beforePct,
            afterPct,
            status: "updated",
          });
          totalFieldsEnriched += fieldCount;
        } catch (err: any) {
          results.push({
            courseId: course.courseId,
            courseName: course.courseName,
            fieldsEnriched: 0,
            extractedFrom: [],
            beforePct,
            afterPct: beforePct,
            status: "error",
            error: err.message,
          });
        }
      } else {
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          fieldsEnriched: fieldCount,
          extractedFrom: enrichment.extractedFrom,
          beforePct,
          afterPct,
          status: "dry_run",
        });
        totalFieldsEnriched += fieldCount;
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const noChanges = results.filter((r) => r.status === "no_changes").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        totalProcessed: courses.length,
        updated,
        noChanges,
        errors,
        totalFieldsEnriched,
      },
      results,
    });
  } catch (error: any) {
    console.error("Smart enrichment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/admin/enrich-smart
 *
 * Returns detailed enrichment stats per field and per course tier.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const tierFilter = searchParams.get("tier") || "";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "enrichment";

    // Get all courses with enrichment-relevant fields
    const where: any = {};
    if (search) {
      where.courseName = { contains: search, mode: "insensitive" };
    }

    // Field-level stats via raw SQL
    const fieldStats = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*) as total_courses,
        COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as has_description,
        COUNT(CASE WHEN par IS NOT NULL THEN 1 END) as has_par,
        COUNT(CASE WHEN year_opened IS NOT NULL THEN 1 END) as has_year_opened,
        COUNT(CASE WHEN original_architect IS NOT NULL THEN 1 END) as has_architect,
        COUNT(CASE WHEN course_type IS NOT NULL THEN 1 END) as has_course_type,
        COUNT(CASE WHEN access_type IS NOT NULL THEN 1 END) as has_access_type,
        COUNT(CASE WHEN course_style IS NOT NULL THEN 1 END) as has_course_style,
        COUNT(CASE WHEN tagline IS NOT NULL AND tagline != '' THEN 1 END) as has_tagline,
        COUNT(CASE WHEN green_fee_low IS NOT NULL THEN 1 END) as has_green_fee_low,
        COUNT(CASE WHEN green_fee_high IS NOT NULL THEN 1 END) as has_green_fee_high,
        COUNT(CASE WHEN price_tier IS NOT NULL THEN 1 END) as has_price_tier,
        COUNT(CASE WHEN walking_policy IS NOT NULL THEN 1 END) as has_walking_policy,
        COUNT(CASE WHEN dress_code IS NOT NULL THEN 1 END) as has_dress_code,
        COUNT(CASE WHEN caddie_availability IS NOT NULL THEN 1 END) as has_caddie,
        COUNT(CASE WHEN how_to_get_on IS NOT NULL AND how_to_get_on != '' THEN 1 END) as has_how_to_get_on,
        COUNT(CASE WHEN guest_policy IS NOT NULL AND guest_policy != '' THEN 1 END) as has_guest_policy,
        COUNT(CASE WHEN what_to_expect IS NOT NULL AND what_to_expect != '' THEN 1 END) as has_what_to_expect,
        COUNT(CASE WHEN course_strategy IS NOT NULL AND course_strategy != '' THEN 1 END) as has_course_strategy,
        COUNT(CASE WHEN insider_tips IS NOT NULL THEN 1 END) as has_insider_tips,
        COUNT(CASE WHEN signature_hole_description IS NOT NULL AND signature_hole_description != '' THEN 1 END) as has_signature_hole,
        COUNT(CASE WHEN best_par3 IS NOT NULL THEN 1 END) as has_best_par3,
        COUNT(CASE WHEN best_par4 IS NOT NULL THEN 1 END) as has_best_par4,
        COUNT(CASE WHEN best_par5 IS NOT NULL THEN 1 END) as has_best_par5,
        COUNT(CASE WHEN design_philosophy IS NOT NULL AND design_philosophy != '' THEN 1 END) as has_design_philosophy,
        COUNT(CASE WHEN practice_facilities IS NOT NULL THEN 1 END) as has_practice,
        COUNT(CASE WHEN fairway_grass IS NOT NULL THEN 1 END) as has_fairway_grass,
        COUNT(CASE WHEN green_grass IS NOT NULL THEN 1 END) as has_green_grass,
        COUNT(CASE WHEN green_speed IS NOT NULL AND green_speed != '' THEN 1 END) as has_green_speed,
        COUNT(CASE WHEN best_condition_months IS NOT NULL AND best_condition_months != '' THEN 1 END) as has_best_condition_months,
        COUNT(CASE WHEN best_time_to_play IS NOT NULL THEN 1 END) as has_best_time,
        COUNT(CASE WHEN best_months IS NOT NULL THEN 1 END) as has_best_months,
        COUNT(CASE WHEN golf_season IS NOT NULL THEN 1 END) as has_golf_season,
        COUNT(CASE WHEN average_round_time IS NOT NULL THEN 1 END) as has_round_time,
        COUNT(CASE WHEN championship_history IS NOT NULL THEN 1 END) as has_championship_history,
        COUNT(CASE WHEN famous_moments IS NOT NULL THEN 1 END) as has_famous_moments,
        COUNT(CASE WHEN website_url IS NOT NULL THEN 1 END) as has_website,
        COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as has_phone,
        COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as has_coordinates,
        COUNT(CASE WHEN street_address IS NOT NULL THEN 1 END) as has_address
      FROM courses
    `;

    // Get per-course enrichment percentages
    const courses = await prisma.course.findMany({
      where,
      select: {
        courseId: true,
        courseName: true,
        city: true,
        state: true,
        accessType: true,
        description: true,
        par: true,
        yearOpened: true,
        originalArchitect: true,
        courseType: true,
        courseStyle: true,
        tagline: true,
        greenFeeLow: true,
        greenFeeHigh: true,
        priceTier: true,
        walkingPolicy: true,
        dressCode: true,
        caddieAvailability: true,
        howToGetOn: true,
        guestPolicy: true,
        whatToExpect: true,
        courseStrategy: true,
        insiderTips: true,
        signatureHoleDescription: true,
        bestPar3: true,
        bestPar4: true,
        bestPar5: true,
        designPhilosophy: true,
        practiceFacilities: true,
        fairwayGrass: true,
        greenGrass: true,
        greenSpeed: true,
        bestConditionMonths: true,
        bestTimeToPlay: true,
        bestMonths: true,
        golfSeason: true,
        averageRoundTime: true,
        championshipHistory: true,
        famousMoments: true,
        websiteUrl: true,
        phone: true,
        latitude: true,
        streetAddress: true,
      },
      orderBy: { courseName: "asc" },
    });

    // Calculate enrichment for each course and assign tier
    const coursesWithEnrichment = courses.map((c) => {
      const pct = calculateEnrichmentPct(c as any);
      let tier: string;
      if (pct >= 80) tier = "excellent";
      else if (pct >= 60) tier = "good";
      else if (pct >= 40) tier = "fair";
      else if (pct >= 20) tier = "poor";
      else tier = "minimal";

      // Calculate which fields are missing
      const missingFields = ENRICHMENT_FIELDS.filter((f) => {
        const val = (c as any)[f.key];
        return val === null || val === undefined || val === "";
      }).map((f) => f.label);

      return {
        courseId: c.courseId,
        courseName: c.courseName,
        city: c.city,
        state: c.state,
        accessType: c.accessType,
        enrichmentPct: pct,
        tier,
        missingFields,
        hasDescription: !!c.description,
      };
    });

    // Apply tier filter
    let filtered = coursesWithEnrichment;
    if (tierFilter) {
      filtered = filtered.filter((c) => c.tier === tierFilter);
    }

    // Sort
    if (sortBy === "enrichment") {
      filtered.sort((a, b) => a.enrichmentPct - b.enrichmentPct);
    } else if (sortBy === "enrichment_desc") {
      filtered.sort((a, b) => b.enrichmentPct - a.enrichmentPct);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.courseName.localeCompare(b.courseName));
    }

    // Tier distribution
    const tierCounts = {
      excellent: coursesWithEnrichment.filter((c) => c.tier === "excellent").length,
      good: coursesWithEnrichment.filter((c) => c.tier === "good").length,
      fair: coursesWithEnrichment.filter((c) => c.tier === "fair").length,
      poor: coursesWithEnrichment.filter((c) => c.tier === "poor").length,
      minimal: coursesWithEnrichment.filter((c) => c.tier === "minimal").length,
    };

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      fieldStats: fieldStats[0],
      tierCounts,
      courses: paged,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgEnrichment: coursesWithEnrichment.length > 0
        ? Math.round(
            coursesWithEnrichment.reduce((sum, c) => sum + c.enrichmentPct, 0) /
            coursesWithEnrichment.length
          )
        : 0,
    });
  } catch (error: any) {
    console.error("Enrichment stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
