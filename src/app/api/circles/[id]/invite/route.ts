import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCircleAuth } from "@/lib/circle-auth";
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

    const auth = await withCircleAuth(circleId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if members can invite
    if (auth.membership!.role === "MEMBER") {
      const config = auth.circle!.config as any;
      if (!config?.allowMemberInvites) {
        return NextResponse.json({ error: "Members cannot send invites in this circle" }, { status: 403 });
      }
    }

    const { userIds, emails } = await req.json();
    const invites = [];

    if (userIds && Array.isArray(userIds)) {
      for (const inviteeId of userIds) {
        // Skip if already a member
        const existing = await prisma.circleMembership.findUnique({
          where: { circleId_userId: { circleId, userId: inviteeId } },
        });
        if (existing) continue;

        // Skip if already invited
        const existingInvite = await prisma.circleInvite.findFirst({
          where: { circleId, inviteeId, status: "PENDING" },
        });
        if (existingInvite) continue;

        const invite = await prisma.circleInvite.create({
          data: {
            circleId,
            inviterId: userId,
            inviteeId,
            status: "PENDING",
          },
        });
        invites.push(invite);

        await createNotification({
          userId: inviteeId,
          type: "CIRCLE_INVITE",
          title: `${session.user?.name ?? "Someone"} invited you to join ${auth.circle!.name}`,
          actionUrl: `/circles`,
          metadata: { circleId, inviteId: invite.id },
        });
      }
    }

    if (emails && Array.isArray(emails)) {
      for (const email of emails) {
        const existingInvite = await prisma.circleInvite.findFirst({
          where: { circleId, inviteeEmail: email, status: "PENDING" },
        });
        if (existingInvite) continue;

        // Check if email belongs to an existing user
        const existingUser = await prisma.user.findUnique({ where: { email } });

        const invite = await prisma.circleInvite.create({
          data: {
            circleId,
            inviterId: userId,
            inviteeId: existingUser?.id ?? null,
            inviteeEmail: email,
            status: "PENDING",
          },
        });
        invites.push(invite);

        if (existingUser) {
          await createNotification({
            userId: existingUser.id,
            type: "CIRCLE_INVITE",
            title: `${session.user?.name ?? "Someone"} invited you to join ${auth.circle!.name}`,
            actionUrl: `/circles`,
            metadata: { circleId, inviteId: invite.id },
          });
        }
      }
    }

    return NextResponse.json({ invites, count: invites.length }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/invite error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
