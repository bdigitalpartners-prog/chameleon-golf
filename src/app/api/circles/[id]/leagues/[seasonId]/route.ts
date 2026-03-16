import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string; seasonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const season = await prisma.leagueSeason.findUnique({
    where: { id: params.seasonId },
    include: {
      standings: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: [{ points: "desc" }, { wins: "desc" }],
      },
    },
  });

  if (!season || season.circleId !== params.id) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  // Assign ranks
  const standings = season.standings.map((s, i) => ({ ...s, rank: i + 1 }));

  return NextResponse.json({ season: { ...season, standings } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; seasonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const existing = await prisma.leagueSeason.findUnique({ where: { id: params.seasonId } });
  if (!existing || existing.circleId !== params.id) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, status, startDate, endDate, pointSystem, divisions, playoffConfig } = body;

  const season = await prisma.leagueSeason.update({
    where: { id: params.seasonId },
    data: {
      ...(name !== undefined && { name }),
      ...(status !== undefined && { status }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(pointSystem !== undefined && { pointSystem }),
      ...(divisions !== undefined && { divisions }),
      ...(playoffConfig !== undefined && { playoffConfig }),
    },
  });

  return NextResponse.json({ season });
}
