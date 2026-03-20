import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    // Ensure screenshot_url column is TEXT (not VARCHAR) so base64 data URIs fit
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE admin_verification_queue
        ALTER COLUMN screenshot_url TYPE TEXT
      `);
    } catch {
      // already TEXT or column doesn't exist — ignore
    }

    const { ghinNumber, handicapIndex, screenshotUrl } = await req.json();

    if (!ghinNumber || typeof ghinNumber !== "string" || !/^\d{7,8}$/.test(ghinNumber.trim())) {
      return NextResponse.json({ error: "GHIN number must be 7 or 8 digits" }, { status: 400 });
    }

    const trimmedGhin = ghinNumber.trim();
    const handicapVal = handicapIndex != null && !isNaN(Number(handicapIndex)) ? Number(handicapIndex) : null;
    const screenshot = screenshotUrl || null;

    // Check for existing pending/approved entry
    const existing = await prisma.$queryRaw<Array<{ status: string }>>`
      SELECT status FROM admin_verification_queue
      WHERE user_id = ${userId} AND status IN ('pending', 'approved')
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({
        error: existing[0].status === "approved"
          ? "Your GHIN is already verified"
          : "You already have a pending verification request",
      }, { status: 409 });
    }

    // Update user record
    await prisma.$executeRaw`
      UPDATE users
      SET ghin_number = ${trimmedGhin},
          handicap_index = ${handicapVal}
      WHERE id = ${userId}
    `;

    // Create verification queue entry
    const result = await prisma.$queryRaw<Array<{ queue_id: number }>>`
      INSERT INTO admin_verification_queue (user_id, score_id, course_id, screenshot_url, ghin_number, status, submitted_at)
      VALUES (${userId}, 0, 0, ${screenshot}, ${trimmedGhin}, 'pending', NOW())
      RETURNING queue_id
    `;

    return NextResponse.json({
      success: true,
      queueId: result[0]?.queue_id,
      message: "Verification request submitted. An admin will review it shortly.",
    });
  } catch (error: any) {
    console.error("POST /api/ghin/submit error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Raw SQL to avoid Prisma schema mismatch
    const users = await prisma.$queryRaw<Array<{
      ghin_number: string | null;
      ghin_verified: boolean;
      ghin_verified_at: Date | null;
      handicap_index: number | null;
    }>>`
      SELECT ghin_number, ghin_verified, ghin_verified_at, handicap_index
      FROM users WHERE id = ${userId} LIMIT 1
    `;

    const queue = await prisma.$queryRaw<Array<{
      queue_id: number;
      ghin_number: string | null;
      status: string;
      review_notes: string | null;
      submitted_at: Date;
      reviewed_at: Date | null;
    }>>`
      SELECT queue_id, ghin_number, status, review_notes, submitted_at, reviewed_at
      FROM admin_verification_queue
      WHERE user_id = ${userId}
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    const user = users[0] ?? null;
    const entry = queue[0] ?? null;

    return NextResponse.json({
      ghinNumber: user?.ghin_number,
      ghinVerified: user?.ghin_verified ?? false,
      ghinVerifiedAt: user?.ghin_verified_at,
      latestSubmission: entry
        ? {
            status: entry.status,
            submittedAt: entry.submitted_at,
            reviewNotes: entry.review_notes,
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/ghin/submit error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
