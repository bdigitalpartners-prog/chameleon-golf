import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCircleAuth } from "@/lib/circle-auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const { id: circleId, userId: targetUserId } = params;

    const auth = await withCircleAuth(circleId, currentUserId, ["OWNER", "ADMIN"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { action } = await req.json();
    const targetMembership = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId: targetUserId } },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const circleName = auth.circle!.name;

    switch (action) {
      case "approve": {
        if (targetMembership.role !== "PENDING") {
          return NextResponse.json({ error: "User is not pending" }, { status: 400 });
        }
        // Check capacity before approving
        if (auth.circle!.maxMembers && auth.circle!.memberCount >= auth.circle!.maxMembers) {
          return NextResponse.json({ error: "Circle is full" }, { status: 400 });
        }
        await prisma.circleMembership.update({
          where: { id: targetMembership.id },
          data: { role: "MEMBER" },
        });
        await prisma.circle.update({
          where: { id: circleId },
          data: { memberCount: { increment: 1 } },
        });
        await createNotification({
          userId: targetUserId,
          type: "CIRCLE_REQUEST_APPROVED",
          title: `Your request to join ${circleName} was approved`,
          actionUrl: `/circles/${circleId}`,
          metadata: { circleId },
        });
        break;
      }
      case "promote": {
        if (targetMembership.role !== "MEMBER") {
          return NextResponse.json({ error: "Can only promote members" }, { status: 400 });
        }
        await prisma.circleMembership.update({
          where: { id: targetMembership.id },
          data: { role: "ADMIN" },
        });
        await createNotification({
          userId: targetUserId,
          type: "CIRCLE_ROLE_CHANGE",
          title: `You were promoted to Admin in ${circleName}`,
          actionUrl: `/circles/${circleId}`,
          metadata: { circleId, newRole: "ADMIN" },
        });
        break;
      }
      case "demote": {
        if (targetMembership.role !== "ADMIN") {
          return NextResponse.json({ error: "Can only demote admins" }, { status: 400 });
        }
        if (auth.membership!.role !== "OWNER") {
          return NextResponse.json({ error: "Only owners can demote admins" }, { status: 403 });
        }
        await prisma.circleMembership.update({
          where: { id: targetMembership.id },
          data: { role: "MEMBER" },
        });
        await createNotification({
          userId: targetUserId,
          type: "CIRCLE_ROLE_CHANGE",
          title: `Your role in ${circleName} was changed to Member`,
          actionUrl: `/circles/${circleId}`,
          metadata: { circleId, newRole: "MEMBER" },
        });
        break;
      }
      case "remove": {
        if (targetMembership.role === "OWNER") {
          return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
        }
        await prisma.circleMembership.delete({
          where: { id: targetMembership.id },
        });
        if (targetMembership.role !== "PENDING") {
          await prisma.circle.update({
            where: { id: circleId },
            data: { memberCount: { decrement: 1 } },
          });
        }
        await createNotification({
          userId: targetUserId,
          type: "CIRCLE_REMOVED",
          title: `You were removed from ${circleName}`,
          metadata: { circleId },
        });
        break;
      }
      case "transfer_ownership": {
        if (auth.membership!.role !== "OWNER") {
          return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
        }
        await prisma.$transaction([
          prisma.circleMembership.update({
            where: { id: auth.membership!.id },
            data: { role: "ADMIN" },
          }),
          prisma.circleMembership.update({
            where: { id: targetMembership.id },
            data: { role: "OWNER" },
          }),
        ]);
        await createNotification({
          userId: targetUserId,
          type: "CIRCLE_ROLE_CHANGE",
          title: `You are now the Owner of ${circleName}`,
          actionUrl: `/circles/${circleId}`,
          metadata: { circleId, newRole: "OWNER" },
        });
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/circles/[id]/members/[userId] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
