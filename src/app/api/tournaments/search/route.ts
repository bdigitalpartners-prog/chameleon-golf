import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Search tournaments by tour, year, name
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const tour = searchParams.get("tour");
  const year = searchParams.get("year");
  const name = searchParams.get("name");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = (page - 1) * limit;

  try {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (tour) {
      params.push(tour);
      whereClause += ` AND ct.tour = $${params.length}`;
    }

    if (year) {
      params.push(Number(year));
      whereClause += ` AND ct.year = $${params.length}`;
    }

    if (name) {
      params.push(`%${name}%`);
      whereClause += ` AND ct.tournament_name ILIKE $${params.length}`;
    }

    const countResult = await prisma.$queryRawUnsafe<[{ count: number }]>(
      `SELECT COUNT(*)::int as count FROM course_tournaments ct ${whereClause}`,
      ...params
    );

    params.push(limit, offset);
    const tournaments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ct.*,
              c."courseName" as course_name,
              c."city", c."state", c."courseId" as cid
       FROM course_tournaments ct
       LEFT JOIN courses c ON c."courseId" = ct.course_id
       ${whereClause}
       ORDER BY ct.year DESC, ct.tournament_name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      ...params
    );

    return NextResponse.json({
      tournaments,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count ?? 0,
        totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Tournament search error:", error);
    return NextResponse.json(
      { error: "Failed to search tournaments", detail: error.message },
      { status: 500 }
    );
  }
}
