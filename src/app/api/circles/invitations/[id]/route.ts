import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    const invite = await prisma.circleInvite.findUnique({
      where: { id },
      include: { circle: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invite.inviteeId !== userId) {
      return NextResponse.json({ error: "Not your invitation" }, { status: 403 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 });
    }

    const { action } = await req.json();

    if (action === "accept") {
      await prisma.$transaction(async (tx) => {
        // Check capacity before accepting
        const freshCircle = await tx.circle.findUnique({ where: { id: invite.circleId } });
        if (freshCircle!.maxMembers && freshCircle!.memberCount >= freshCircle!.maxMembers) {
          throw new Error("CIRCLE_FULL");
        }

        await tx.circleInvite.update({
          where: { id },
          data: { status: "ACCEPTED" },
        });

        await tx.circleMembership.create({
          data: {
            circleId: invite.circleId,
            userId,
            role: "MEMBER",
          },
        });

        await tx.circle.update({
          where: { id: invite.circleId },
          data: { memberCount: { increment: 1 } },
        });
      });

      await createNotification({
        userId: invite.inviterId,
        type: "CIRCLE_INVITE_ACCEPTED",
        title: `${session.user?.name ?? "Someone"} accepted your invite to ${invite.circle.name}`,
        actionUrl: `/circles/${invite.circleId}`,
        metadata: { circleId: invite.circleId },
      });

      return NextResponse.json({ success: true, circleId: invite.circleId });
    } else if (action === "decline") {
      await prisma.circleInvite.update({
        where: { id },
        data: { status: "DECLINED" },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "CIRCLE_FULL") {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }
    console.error("PATCH /api/circles/invitations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
