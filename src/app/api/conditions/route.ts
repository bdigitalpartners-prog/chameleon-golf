import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Get recent conditions for a course
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const courseId = searchParams.get("courseId");
  const days = Math.min(Number(searchParams.get("days") ?? 7), 90);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = (page - 1) * limit;

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    let whereClause = `WHERE cc.reported_at >= $1`;
    const params: any[] = [since.toISOString()];

    if (courseId) {
      params.push(Number(courseId));
      whereClause += ` AND cc.course_id = $${params.length}`;
    }

    const countResult = await prisma.$queryRawUnsafe<[{ count: number }]>(
      `SELECT COUNT(*)::int as count FROM course_conditions cc ${whereClause}`,
      ...params
    );

    params.push(limit, offset);
    const reports = await prisma.$queryRawUnsafe<any[]>(
      `SELECT cc.*,
              c."courseName" as course_name,
              c."city", c."state",
              u.name as user_name, u.image as user_image,
              (SELECT COUNT(*)::int FROM condition_votes cv WHERE cv.condition_id = cc.id AND cv.vote_type = 'helpful') as helpful_count
       FROM course_conditions cc
       LEFT JOIN courses c ON c."courseId" = cc.course_id
       LEFT JOIN users u ON u.id = cc.user_id
       ${whereClause}
       ORDER BY cc.reported_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      ...params
    );

    return NextResponse.json({
      reports,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    });
  } catch (error) {
    console.error("GET /api/conditions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 }
    );
  }
}

// POST — Submit a condition report
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const {
      courseId,
      greenSpeed,
      greenFirmness,
      fairwayCondition,
      bunkerCondition,
      roughHeight,
      paceOfPlay,
      windConditions,
      overallRating,
      notes,
      photoUrls,
    } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Validate overall rating (1-5)
    if (
      overallRating !== undefined &&
      (overallRating < 1 || overallRating > 5)
    ) {
      return NextResponse.json(
        { error: "overallRating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate enums
    const validGreenSpeeds = ["slow", "medium", "fast", "tournament"];
    const validFirmness = ["soft", "medium", "firm", "very_firm"];
    const validFairway = ["poor", "fair", "good", "excellent", "pristine"];
    const validBunker = ["poor", "fair", "good", "excellent"];
    const validRough = ["low", "medium", "high", "us_open"];
    const validWind = ["calm", "light", "moderate", "strong", "extreme"];

    if (greenSpeed && !validGreenSpeeds.includes(greenSpeed)) {
      return NextResponse.json(
        { error: "Invalid greenSpeed value" },
        { status: 400 }
      );
    }
    if (greenFirmness && !validFirmness.includes(greenFirmness)) {
      return NextResponse.json(
        { error: "Invalid greenFirmness value" },
        { status: 400 }
      );
    }
    if (fairwayCondition && !validFairway.includes(fairwayCondition)) {
      return NextResponse.json(
        { error: "Invalid fairwayCondition value" },
        { status: 400 }
      );
    }
    if (bunkerCondition && !validBunker.includes(bunkerCondition)) {
      return NextResponse.json(
        { error: "Invalid bunkerCondition value" },
        { status: 400 }
      );
    }
    if (roughHeight && !validRough.includes(roughHeight)) {
      return NextResponse.json(
        { error: "Invalid roughHeight value" },
        { status: 400 }
      );
    }
    if (windConditions && !validWind.includes(windConditions)) {
      return NextResponse.json(
        { error: "Invalid windConditions value" },
        { status: 400 }
      );
    }

    const result = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO course_conditions
        (course_id, user_id, green_speed, green_firmness, fairway_condition,
         bunker_condition, rough_height, pace_of_play, wind_conditions,
         overall_rating, notes, photo_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      Number(courseId),
      userId,
      greenSpeed || null,
      greenFirmness || null,
      fairwayCondition || null,
      bunkerCondition || null,
      roughHeight || null,
      paceOfPlay ? Number(paceOfPlay) : null,
      windConditions || null,
      overallRating ? Number(overallRating) : null,
      notes || null,
      photoUrls ? JSON.stringify(photoUrls) : null
    );

    return NextResponse.json({ report: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/conditions error:", error);
    return NextResponse.json(
      { error: "Failed to submit condition report" },
      { status: 500 }
    );
  }
}
