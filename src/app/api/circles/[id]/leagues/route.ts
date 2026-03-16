import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const seasons = await prisma.leagueSeason.findMany({
    where: { circleId: params.id },
    include: { _count: { select: { standings: true } } },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ seasons });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const body = await req.json();
  const { name, startDate, endDate, pointSystem, divisions, playoffConfig } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "Name, startDate, and endDate are required" }, { status: 400 });
  }

  const season = await prisma.leagueSeason.create({
    data: {
      circleId: params.id,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pointSystem: pointSystem ?? { win: 3, tie: 1, loss: 0, birdie_bonus: 1 },
      divisions: divisions ?? undefined,
      playoffConfig: playoffConfig ?? undefined,
    },
  });

  // Add all circle members as initial standings
  const members = await prisma.circleMembership.findMany({
    where: { circleId: params.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    select: { userId: true },
  });

  if (members.length > 0) {
    await prisma.leagueStanding.createMany({
      data: members.map((m) => ({
        seasonId: season.id,
        userId: m.userId,
      })),
    });
  }

  return NextResponse.json({ season }, { status: 201 });
}
