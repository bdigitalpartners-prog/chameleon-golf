import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Search walkable courses
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const walkable = searchParams.get("walkable");
  const state = searchParams.get("state");
  const terrain = searchParams.get("terrain");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = (page - 1) * limit;

  try {
    let whereConditions: string[] = [];
    const params: any[] = [];

    if (walkable === "true") {
      whereConditions.push("wp.walking_allowed = true");
    } else if (walkable === "false") {
      whereConditions.push(
        "(wp.walking_allowed = false OR wp.walking_allowed IS NULL)"
      );
    }

    if (state) {
      params.push(state);
      whereConditions.push(`c."state" = $${params.length}`);
    }

    if (terrain) {
      params.push(terrain);
      whereConditions.push(`wp.terrain_difficulty = $${params.length}`);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    const countParams = [...params];
    const countResult = await prisma.$queryRawUnsafe<[{ count: number }]>(
      `SELECT COUNT(*)::int as count
       FROM course_walking_policy wp
       LEFT JOIN courses c ON c."courseId" = wp.course_id
       ${whereClause}`,
      ...countParams
    );

    params.push(limit, offset);
    const courses = await prisma.$queryRawUnsafe<any[]>(
      `SELECT wp.*,
              c."courseName" as course_name,
              c."city", c."state", c."courseStyle",
              c."accessType", c."greenFeeLow", c."greenFeeHigh"
       FROM course_walking_policy wp
       LEFT JOIN courses c ON c."courseId" = wp.course_id
       ${whereClause}
       ORDER BY c."courseName" ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      ...params
    );

    return NextResponse.json({
      courses,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    });
  } catch (error) {
    console.error("GET /api/walking-policy/search error:", error);
    return NextResponse.json(
      { error: "Failed to search walking policies" },
      { status: 500 }
    );
  }
}
