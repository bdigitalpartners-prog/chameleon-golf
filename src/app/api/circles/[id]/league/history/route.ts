import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const seasons = await prisma.leagueSeason.findMany({
      where: { circleId: params.id },
      include: {
        standings: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { totalPoints: "desc" },
          take: 5,
        },
        _count: { select: { rounds: true, standings: true } },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ seasons });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/league/history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
