import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

// POST — Vouch for a member
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; verificationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  // Current user must be verified member
  const auth = await withCircleAuth(circleId, userId, [
    "OWNER",
    "ADMIN",
    "MEMBER",
  ]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  // Check voucher is verified
  const membership = await prisma.circleMembership.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });
  if (!membership?.verifiedAt) {
    return NextResponse.json(
      { error: "Only verified members can vouch" },
      { status: 403 }
    );
  }

  const verification = await prisma.clubVerification.findUnique({
    where: { id: params.verificationId },
  });

  if (!verification || verification.circleId !== circleId) {
    return NextResponse.json(
      { error: "Verification not found" },
      { status: 404 }
    );
  }

  if (verification.method !== "VOUCHING") {
    return NextResponse.json(
      { error: "This verification does not use vouching" },
      { status: 400 }
    );
  }

  if (verification.status === "APPROVED") {
    return NextResponse.json(
      { error: "Already approved" },
      { status: 400 }
    );
  }

  // Can't vouch for yourself
  if (verification.userId === userId) {
    return NextResponse.json(
      { error: "Cannot vouch for yourself" },
      { status: 400 }
    );
  }

  // Check not already vouched
  if (verification.vouchedBy.includes(userId)) {
    return NextResponse.json(
      { error: "Already vouched" },
      { status: 400 }
    );
  }

  const newVouchedBy = [...verification.vouchedBy, userId];
  const autoApprove = newVouchedBy.length >= 2;

  const updated = await prisma.clubVerification.update({
    where: { id: params.verificationId },
    data: {
      vouchedBy: newVouchedBy,
      status: autoApprove ? "APPROVED" : "PENDING",
      verifiedAt: autoApprove ? new Date() : null,
    },
  });

  // Auto-approve membership
  if (autoApprove) {
    await prisma.circleMembership.updateMany({
      where: { circleId, userId: verification.userId },
      data: { verifiedAt: new Date() },
    });

    await createNotification({
      userId: verification.userId,
      type: "VERIFICATION_APPROVED",
      title: "Your membership has been verified!",
      body: "Two members vouched for you.",
      actionUrl: `/circles/${circleId}`,
    });
  }

  return NextResponse.json({ verification: updated });
}
