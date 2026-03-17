import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

// GET — Get verification status for current user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  // Verify the user is a member of this circle
  const membership = await prisma.circleMembership.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this circle" }, { status: 403 });
  }

  const verification = await prisma.clubVerification.findUnique({
    where: { circleId_userId: { circleId, userId } },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ verification });
}

// POST — Submit verification request
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const circleId = params.id;

  const auth = await withCircleAuth(circleId, userId, [
    "OWNER",
    "ADMIN",
    "MEMBER",
    "PENDING",
  ]);
  if (!auth.circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }

  // Check if already verified
  const existing = await prisma.clubVerification.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });
  if (existing?.status === "APPROVED") {
    return NextResponse.json(
      { error: "Already verified" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { method, evidenceUrl, domainEmail } = body;

  if (!["NONE", "ADMIN_APPROVAL", "CODE", "EMAIL_DOMAIN"].includes(method)) {
    return NextResponse.json(
      { error: "Invalid verification method" },
      { status: 400 }
    );
  }

  const verification = await prisma.clubVerification.upsert({
    where: { circleId_userId: { circleId, userId } },
    create: {
      circleId,
      userId,
      method,
      status: "PENDING",
      evidenceUrl: method === "CODE" ? evidenceUrl : null,
      domainEmail: method === "EMAIL_DOMAIN" ? domainEmail : null,
      vouchedBy: [],
    },
    update: {
      method,
      status: "PENDING",
      evidenceUrl: method === "CODE" ? evidenceUrl : null,
      domainEmail: method === "EMAIL_DOMAIN" ? domainEmail : null,
      vouchedBy: [],
      verifiedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    },
  });

  // Notify circle admins for ADMIN_MANUAL and DOCUMENT methods
  if (method === "ADMIN_APPROVAL" || method === "CODE") {
    const admins = await prisma.circleMembership.findMany({
      where: { circleId, role: { in: ["OWNER", "ADMIN"] } },
      select: { userId: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    for (const admin of admins) {
      await createNotification({
        userId: admin.userId,
        type: "VERIFICATION_REQUEST",
        title: `${user?.name ?? "A member"} requested verification`,
        body: `Method: ${method.toLowerCase().replace("_", " ")}`,
        actionUrl: `/circles/${circleId}/settings`,
      });
    }
  }

  return NextResponse.json({ verification }, { status: 201 });
}
