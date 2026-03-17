import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: circleId } = params;

    const circle = await prisma.circle.findUnique({ where: { id: circleId } });
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    if (circle.privacy === "SECRET") {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const existing = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member or pending" }, { status: 409 });
    }

    const isPublic = circle.privacy === "PUBLIC";
    const role = isPublic ? "MEMBER" : "PENDING";

    const membership = await prisma.$transaction(async (tx) => {
      // Re-check capacity inside transaction to prevent race conditions
      const freshCircle = await tx.circle.findUnique({ where: { id: circleId } });
      if (freshCircle!.maxMembers && freshCircle!.memberCount >= freshCircle!.maxMembers) {
        throw new Error("CIRCLE_FULL");
      }

      const created = await tx.circleMembership.create({
        data: { circleId, userId, role },
      });

      if (isPublic) {
        await tx.circle.update({
          where: { id: circleId },
          data: { memberCount: { increment: 1 } },
        });
      }

      return created;
    });

    // Notify admins of the join/request
    const admins = await prisma.circleMembership.findMany({
      where: { circleId, role: { in: ["OWNER", "ADMIN"] } },
      select: { userId: true },
    });

    const notifType = isPublic ? "CIRCLE_NEW_MEMBER" : "CIRCLE_JOIN_REQUEST";
    const notifTitle = isPublic
      ? `${session.user?.name ?? "Someone"} joined ${circle.name}`
      : `${session.user?.name ?? "Someone"} requested to join ${circle.name}`;

    for (const admin of admins) {
      await createNotification({
        userId: admin.userId,
        type: notifType,
        title: notifTitle,
        actionUrl: `/circles/${circleId}/members`,
        metadata: { circleId, userId },
      });
    }

    return NextResponse.json(membership, { status: 201 });
  } catch (error: any) {
    if (error.message === "CIRCLE_FULL") {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }
    console.error("POST /api/circles/[id]/join error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
