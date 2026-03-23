import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    const year = parseInt(params.year, 10);
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    // Check for share token first (public access)
    const shareToken = request.nextUrl.searchParams.get("token");
    if (shareToken) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, user_id, year, data, share_token, is_public, generated_at
         FROM eq_wrapped
         WHERE share_token = $1 AND year = $2 AND is_public = true`,
        shareToken,
        year
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: "Wrapped not found" }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    // Authenticated access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, user_id, year, data, share_token, is_public, generated_at
       FROM eq_wrapped
       WHERE user_id = $1 AND year = $2`,
      parseInt(userId, 10),
      year
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "No wrapped data for this year", available: false }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("GET /api/wrapped/[year] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
