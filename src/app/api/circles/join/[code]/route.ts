import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params;

    const invite = await prisma.circleInvite.findUnique({
      where: { inviteCode: code },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            description: true,
            imageUrl: true,
            memberCount: true,
            privacy: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Invite code has expired", expired: true }, { status: 410 });
    }

    const session = await getServerSession(authOptions);
    let isMember = false;
    if (session) {
      const userId = (session.user as any).id;
      const membership = await prisma.circleMembership.findUnique({
        where: { circleId_userId: { circleId: invite.circleId, userId } },
      });
      isMember = !!membership;
    }

    return NextResponse.json({
      circle: invite.circle,
      isMember,
    });
  } catch (error: any) {
    console.error("GET /api/circles/join/[code] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { code } = params;

    const invite = await prisma.circleInvite.findUnique({
      where: { inviteCode: code },
      include: { circle: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 410 });
    }

    const existing = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId: invite.circleId, userId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Re-check capacity inside transaction to prevent race conditions
      const freshCircle = await tx.circle.findUnique({ where: { id: invite.circleId } });
      if (freshCircle!.maxMembers && freshCircle!.memberCount >= freshCircle!.maxMembers) {
        throw new Error("CIRCLE_FULL");
      }

      const membership = await tx.circleMembership.create({
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

      return membership;
    });

    return NextResponse.json({
      membership: result,
      circleId: invite.circleId,
      circleSlug: invite.circle.slug,
    }, { status: 201 });
  } catch (error: any) {
    if (error.message === "CIRCLE_FULL") {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }
    console.error("POST /api/circles/join/[code] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
