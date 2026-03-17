import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import { generateWeatherData } from "@/lib/weather-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/admin/weather-enrich
 * Generate weather data for courses using OpenAI.
 * Body: { courseIds?: number[], limit?: number, overwrite?: boolean }
 */
export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { courseIds, limit = 50, overwrite = false } = body;

    const where: any = {};
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      if (courseIds.length > 200) {
        return NextResponse.json({ error: "Max 200 courseIds per request" }, { status: 400 });
      }
      where.courseId = { in: courseIds.map(Number) };
    }

    const courses = await prisma.course.findMany({
      where,
      select: {
        courseId: true,
        courseName: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        _count: { select: { weatherMonths: true } },
      },
      orderBy: [{ numListsAppeared: "desc" }, { courseId: "asc" }],
      take: Math.min(limit, 200),
    });

    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const results: Array<{
      courseId: number;
      courseName: string;
      status: "generated" | "skipped" | "error";
      bestMonths?: number[];
      error?: string;
    }> = [];

    for (const course of courses) {
      if (course._count.weatherMonths > 0 && !overwrite) {
        skipped++;
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          status: "skipped",
        });
        continue;
      }

      try {
        const weatherData = await generateWeatherData({
          courseId: course.courseId,
          courseName: course.courseName,
          city: course.city,
          state: course.state,
          country: course.country,
          latitude: course.latitude ? Number(course.latitude) : null,
          longitude: course.longitude ? Number(course.longitude) : null,
        });

        // Delete existing weather data if overwriting
        if (course._count.weatherMonths > 0 && overwrite) {
          await prisma.courseWeather.deleteMany({
            where: { courseId: course.courseId },
          });
        }

        // Insert all 12 months
        await prisma.courseWeather.createMany({
          data: weatherData.map((w) => ({
            courseId: course.courseId,
            month: w.month,
            avgHighF: w.avgHighF,
            avgLowF: w.avgLowF,
            avgPrecipInches: w.avgPrecipInches,
            avgPrecipDays: w.avgPrecipDays,
            avgSunnyDays: w.avgSunnyDays,
            humidity: w.humidity,
            windSpeedMph: w.windSpeedMph,
            playabilityScore: w.playabilityScore,
            bestTimeOfDay: w.bestTimeOfDay,
          })),
        });

        // Compute best/worst months and update the Course record
        const sorted = [...weatherData].sort(
          (a, b) => b.playabilityScore - a.playabilityScore
        );
        const bestMonths = sorted
          .filter((m) => m.playabilityScore >= 70)
          .map((m) => m.month);
        const worstMonths = sorted
          .filter((m) => m.playabilityScore < 50)
          .map((m) => m.month);

        // Build weatherData JSON for the legacy field
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const weatherJson: Record<string, any> = {};
        for (const w of weatherData) {
          weatherJson[monthNames[w.month - 1]] = {
            avg_high: w.avgHighF,
            avg_low: w.avgLowF,
            rain_inches: w.avgPrecipInches,
            wind_mph: w.windSpeedMph,
            playability: w.playabilityScore,
          };
        }

        await prisma.course.update({
          where: { courseId: course.courseId },
          data: {
            weatherData: weatherJson,
            bestMonths: bestMonths,
            worstMonths: worstMonths,
          },
        });

        generated++;
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          status: "generated",
          bestMonths,
        });
      } catch (err: any) {
        errors.push(`Course ${course.courseId} (${course.courseName}): ${err.message}`);
        results.push({
          courseId: course.courseId,
          courseName: course.courseName,
          status: "error",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: courses.length,
      generated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      results: results.slice(0, 100),
    });
  } catch (err: any) {
    console.error("Weather enrichment error:", err);
    return NextResponse.json(
      { error: err.message || "Weather enrichment failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/weather-enrich?courseId=123
 * Get weather data for a specific course.
 */
export async function GET(req: NextRequest) {
  const authError = await checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      // Return summary stats
      const totalCourses = await prisma.course.count();
      const coursesWithWeather = await prisma.courseWeather.groupBy({
        by: ["courseId"],
      });
      return NextResponse.json({
        totalCourses,
        coursesWithWeather: coursesWithWeather.length,
        coveragePercent:
          totalCourses > 0
            ? Math.round((coursesWithWeather.length / totalCourses) * 100)
            : 0,
      });
    }

    const weather = await prisma.courseWeather.findMany({
      where: { courseId: parseInt(courseId, 10) },
      orderBy: { month: "asc" },
    });

    const course = await prisma.course.findUnique({
      where: { courseId: parseInt(courseId, 10) },
      select: { courseName: true, bestMonths: true, worstMonths: true },
    });

    return NextResponse.json({
      courseId: parseInt(courseId, 10),
      courseName: course?.courseName,
      bestMonths: course?.bestMonths,
      worstMonths: course?.worstMonths,
      months: weather,
    });
  } catch (err: any) {
    console.error("Weather fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Fetch failed" },
      { status: 500 }
    );
  }
}
