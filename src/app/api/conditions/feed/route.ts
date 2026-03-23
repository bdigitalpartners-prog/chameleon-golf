import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Activity feed of recent conditions across all courses
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const offset = (page - 1) * limit;

  try {
    const [reports, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT cc.*,
                c."courseName" as course_name,
                c."city", c."state", c."courseStyle",
                u.name as user_name, u.image as user_image,
                (SELECT COUNT(*)::int FROM condition_votes cv WHERE cv.condition_id = cc.id AND cv.vote_type = 'helpful') as helpful_count
         FROM course_conditions cc
         LEFT JOIN courses c ON c."courseId" = cc.course_id
         LEFT JOIN users u ON u.id = cc.user_id
         ORDER BY cc.reported_at DESC
         LIMIT $1 OFFSET $2`,
        limit,
        offset
      ),
      prisma.$queryRawUnsafe<[{ count: number }]>(
        `SELECT COUNT(*)::int as count FROM course_conditions`
      ),
    ]);

    return NextResponse.json({
      reports,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    });
  } catch (error) {
    console.error("GET /api/conditions/feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions feed" },
      { status: 500 }
    );
  }
}
