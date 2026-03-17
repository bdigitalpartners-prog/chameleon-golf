import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const invitations = await prisma.circleInvite.findMany({
      where: {
        inviteeId: userId,
        status: "PENDING",
      },
      include: {
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            imageUrl: true,
            memberCount: true,
          },
        },
        inviter: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error("GET /api/circles/invitations error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
