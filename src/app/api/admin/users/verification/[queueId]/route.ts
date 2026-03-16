import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const queueId = parseInt(params.queueId, 10);
    const body = await request.json();
    const { action, notes } = body; // action: "approve" | "reject"

    const item = await prisma.adminVerificationQueue.findFirst({
      where: { queueId },
    });

    if (!item) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    // Update queue item
    await prisma.$executeRaw`
      UPDATE admin_verification_queue
      SET status = ${action === "approve" ? "approved" : "rejected"},
          reviewed_at = NOW(),
          review_notes = ${notes || null}
      WHERE queue_id = ${queueId}
    `;

    if (action === "approve") {
      // Update the posted score verification status
      await prisma.postedScore.update({
        where: { scoreId: item.scoreId },
        data: {
          verificationStatus: "verified",
          verifiedAt: new Date(),
        },
      });

      // Update user's ghin_verified
      await prisma.user.update({
        where: { id: item.userId },
        data: {
          ghinVerified: true,
          ghinVerifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verification action error:", err);
    return NextResponse.json({ error: "Failed to process verification" }, { status: 500 });
  }
}
