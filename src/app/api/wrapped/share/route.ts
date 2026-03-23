import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const body = await request.json();
    const year = body.year || new Date().getFullYear();

    // Make the wrapped report public
    const result = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE eq_wrapped SET is_public = true, updated_at = NOW()
       WHERE user_id = $1 AND year = $2
       RETURNING share_token, year`,
      userId,
      year
    );

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "No wrapped report found. Generate one first." }, { status: 404 });
    }

    const shareUrl = `/wrapped?token=${result[0].share_token}&year=${result[0].year}`;

    return NextResponse.json({
      success: true,
      share_token: result[0].share_token,
      share_url: shareUrl,
    });
  } catch (error) {
    console.error("POST /api/wrapped/share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
