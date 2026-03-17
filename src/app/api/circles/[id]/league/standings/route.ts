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

    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    // Get active season if not specified
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await prisma.leagueSeason.findFirst({
        where: { circleId: params.id, status: "active" },
        orderBy: { startDate: "desc" },
      });
      if (!activeSeason) return NextResponse.json({ standings: [], season: null });
      targetSeasonId = activeSeason.id;
    }

    const standings = await prisma.leagueStanding.findMany({
      where: { seasonId: targetSeasonId },
      include: {
        user: { select: { id: true, name: true, image: true, handicapIndex: true } },
      },
      orderBy: { totalPoints: "desc" },
    });

    // Assign ranks
    const ranked = standings.map((s, i) => ({
      ...s,
      rank: i + 1,
      totalPoints: Number(s.totalPoints),
      avgEqPoints: Number(s.avgEqPoints),
    }));

    const season = await prisma.leagueSeason.findUnique({ where: { id: targetSeasonId } });

    return NextResponse.json({ standings: ranked, season });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/league/standings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
