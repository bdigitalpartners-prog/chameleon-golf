import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { verificationId, action, note } = body;

    if (!verificationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "verificationId and action (approve/reject) are required" },
        { status: 400 }
      );
    }

    if (action === "reject" && !note) {
      return NextResponse.json(
        { error: "A note is required when rejecting" },
        { status: 400 }
      );
    }

    const queueId = parseInt(verificationId, 10);

    // Look up the verification entry
    const rows = await prisma.$queryRaw<Array<{
      queue_id: number;
      user_id: string;
      ghin_number: string | null;
      status: string;
    }>>`
      SELECT queue_id, user_id, ghin_number, status
      FROM admin_verification_queue
      WHERE queue_id = ${queueId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    const verification = rows[0];

    if (verification.status !== "pending") {
      return NextResponse.json(
        { error: "Verification has already been reviewed" },
        { status: 409 }
      );
    }

    // Get reviewer ID
    const session = await getServerSession(authOptions);
    const reviewerId = (session?.user as any)?.id || null;
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update the queue entry
    await prisma.$executeRaw`
      UPDATE admin_verification_queue
      SET status = ${newStatus},
          reviewed_by = ${reviewerId},
          reviewed_at = NOW(),
          review_notes = ${note || null}
      WHERE queue_id = ${queueId}
    `;

    // If approved, update the user's GHIN verification status
    if (action === "approve" && verification.user_id) {
      await prisma.$executeRaw`
        UPDATE users
        SET ghin_verified = true,
            ghin_verified_at = NOW()
        WHERE id = ${verification.user_id}
      `;
    }

    return NextResponse.json({
      id: String(queueId),
      status: newStatus,
      reviewedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("GHIN review error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to review verification" },
      { status: 500 }
    );
  }
}
