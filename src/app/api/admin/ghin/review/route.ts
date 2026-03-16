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

    const verification = await prisma.ghinVerification.findUnique({
      where: { id: verificationId },
      include: { userProfile: true },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    if (verification.status !== "pending") {
      return NextResponse.json(
        { error: "Verification has already been reviewed" },
        { status: 409 }
      );
    }

    // Get reviewer ID from session
    const session = await getServerSession(authOptions);
    const reviewerId = (session?.user as any)?.id || null;

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update verification
    const updated = await prisma.ghinVerification.update({
      where: { id: verificationId },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });

    // If approved, update the user profile with verified handicap
    if (action === "approve") {
      await prisma.userProfile.update({
        where: { id: verification.userId },
        data: {
          handicapIndex: verification.handicapIndex,
          handicapVerified: true,
          ghinNumber: verification.ghinNumber,
        },
      });

      // Also update the User model's GHIN fields
      await prisma.user.update({
        where: { id: verification.userProfile.userId },
        data: {
          ghinNumber: verification.ghinNumber,
          handicapIndex: verification.handicapIndex,
          ghinVerified: true,
          ghinVerifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
    });
  } catch (err) {
    console.error("GHIN review error:", err);
    return NextResponse.json(
      { error: "Failed to review verification" },
      { status: 500 }
    );
  }
}
