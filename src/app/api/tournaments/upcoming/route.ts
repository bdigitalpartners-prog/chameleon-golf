import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Upcoming tour events (current year and beyond)
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 100);
  const currentYear = new Date().getFullYear();

  try {
    const tournaments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ct.*,
              c."courseName" as course_name,
              c."city", c."state", c."courseId" as cid
       FROM course_tournaments ct
       LEFT JOIN courses c ON c."courseId" = ct.course_id
       WHERE ct.year >= $1
       ORDER BY ct.year ASC, ct.tournament_name ASC
       LIMIT $2`,
      currentYear,
      limit
    );

    return NextResponse.json({ tournaments });
  } catch (error: any) {
    console.error("Upcoming tournaments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming tournaments", detail: error.message },
      { status: 500 }
    );
  }
}
