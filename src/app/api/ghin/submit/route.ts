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

    const { ghinNumber, handicapIndex, screenshotUrl } = await req.json();

    if (!ghinNumber || typeof ghinNumber !== "string" || !/^\d{7,8}$/.test(ghinNumber.trim())) {
      return NextResponse.json({ error: "GHIN number must be 7 or 8 digits" }, { status: 400 });
    }

    const trimmedGhin = ghinNumber.trim();
    const handicapVal = handicapIndex != null && !isNaN(Number(handicapIndex)) ? Number(handicapIndex) : null;
    const screenshot = screenshotUrl || "";

    // Update user's GHIN number and handicap index
    await prisma.$executeRaw`
      UPDATE users 
      SET ghin_number = ${trimmedGhin}, 
          handicap_index = ${handicapVal}
      WHERE id = ${userId}
    `;

    // Ensure user has a UserProfile (required for ghin_verifications FK)
    await prisma.$executeRaw`
      INSERT INTO "UserProfile" (id, "userId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${userId}, NOW(), NOW())
      ON CONFLICT ("userId") DO NOTHING
    `;

    // Get the user's profile ID
    const profileRows = await prisma.$queryRaw<Array<{id: string}>>`
      SELECT id FROM "UserProfile" WHERE "userId" = ${userId} LIMIT 1
    `;
    const profileId = profileRows[0]?.id;

    // Write to ghin_verifications (primary table for admin queue)
    let queueId: string | null = null;
    if (profileId) {
      try {
        // Remove any existing pending entry first
        await prisma.$executeRaw`
          DELETE FROM ghin_verifications 
          WHERE user_id = ${profileId} AND status = 'pending'
        `;

        const verifResult = await prisma.$queryRaw<Array<{id: string}>>`
          INSERT INTO ghin_verifications (id, user_id, ghin_number, handicap_index, screenshot_url, status, created_at, updated_at)
          VALUES (gen_random_uuid()::text, ${profileId}, ${trimmedGhin}, ${handicapVal}, ${screenshot}, 'pending', NOW(), NOW())
          RETURNING id
        `;
        queueId = verifResult[0]?.id ?? null;
      } catch (gvErr: any) {
        console.warn("ghin_verifications insert failed (table may not exist):", gvErr.message);
      }
    }

    // Also write to admin_verification_queue as fallback
    try {
      // Remove any existing pending entry first
      await prisma.$executeRaw`
        DELETE FROM admin_verification_queue 
        WHERE user_id = ${userId} AND status = 'pending'
      `;

      const aqResult = await prisma.$queryRaw<Array<{queue_id: number}>>`
        INSERT INTO admin_verification_queue (user_id, score_id, course_id, screenshot_url, ghin_number, status, submitted_at)
        VALUES (${userId}, 0, 0, ${screenshot || null}, ${trimmedGhin}, 'pending', NOW())
        RETURNING queue_id
      `;
      if (!queueId) queueId = String(aqResult[0]?.queue_id ?? "");
    } catch (aqErr: any) {
      console.warn("admin_verification_queue insert failed:", aqErr.message);
    }

    if (!queueId) {
      return NextResponse.json({ error: "Failed to create verification entry" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queueId,
      message: "Verification request submitted. An admin will review it shortly.",
    });
  } catch (error: any) {
    console.error("POST /api/ghin/submit error:", error?.message || error, JSON.stringify(error?.meta || {}));
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

  const verification = await prisma.adminVerificationQueue.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ghinNumber: true,
      ghinVerified: true,
      ghinVerifiedAt: true,
    },
  });

  return NextResponse.json({
    ghinNumber: user?.ghinNumber,
    ghinVerified: user?.ghinVerified ?? false,
    ghinVerifiedAt: user?.ghinVerifiedAt,
    latestSubmission: verification
      ? {
          status: verification.status,
          submittedAt: verification.submittedAt,
          reviewNotes: verification.reviewNotes,
        }
      : null,
  });
}
