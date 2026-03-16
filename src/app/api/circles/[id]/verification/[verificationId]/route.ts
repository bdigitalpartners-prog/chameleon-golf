import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

// PATCH — Admin: approve/reject verification
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; verificationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const body = await req.json();
  const { action, notes } = body;

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

  const updated = await prisma.clubVerification.update({
    where: { id: params.verificationId },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: userId,
      reviewNotes: notes ?? null,
      verifiedAt: action === "approve" ? new Date() : null,
    },
  });

  // On approve, update CircleMembership.verifiedAt
  if (action === "approve") {
    await prisma.circleMembership.updateMany({
      where: { circleId, userId: verification.userId },
      data: { verifiedAt: new Date() },
    });
  }

  // Notify the user
  await createNotification({
    userId: verification.userId,
    type:
      action === "approve"
        ? "VERIFICATION_APPROVED"
        : "VERIFICATION_REJECTED",
    title:
      action === "approve"
        ? "Your membership has been verified!"
        : "Verification request was not approved",
    body: notes ?? undefined,
    actionUrl: `/circles/${circleId}`,
  });

  return NextResponse.json({ verification: updated });
}
