import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const searchParams = req.nextUrl.searchParams;
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");

  if (!user1 || !user2) {
    return NextResponse.json({ error: "user1 and user2 query params required" }, { status: 400 });
  }

  // Ensure consistent ordering
  const [userId1, userId2] = user1 < user2 ? [user1, user2] : [user2, user1];

  const h2h = await prisma.headToHead.findUnique({
    where: { userId1_userId2_circleId: { userId1, userId2, circleId: params.id } },
  });

  // Get user details
  const [u1, u2] = await Promise.all([
    prisma.user.findUnique({ where: { id: user1 }, select: { id: true, name: true, image: true } }),
    prisma.user.findUnique({ where: { id: user2 }, select: { id: true, name: true, image: true } }),
  ]);

  // Get recent games they played together
  const recentGames = await prisma.game.findMany({
    where: {
      circleId: params.id,
      status: "COMPLETED",
      AND: [
        { players: { some: { userId: user1 } } },
        { players: { some: { userId: user2 } } },
      ],
    },
    include: {
      course: { select: { courseName: true } },
      players: {
        where: { userId: { in: [user1, user2] } },
        select: { userId: true, position: true },
      },
    },
    orderBy: { endDate: "desc" },
    take: 10,
  });

  // Adapt h2h stats based on which user was passed as user1/user2
  let record = { wins1: 0, wins2: 0, ties: 0 };
  if (h2h) {
    if (user1 === userId1) {
      record = { wins1: h2h.wins1, wins2: h2h.wins2, ties: h2h.ties };
    } else {
      record = { wins1: h2h.wins2, wins2: h2h.wins1, ties: h2h.ties };
    }
  }

  return NextResponse.json({
    user1: u1,
    user2: u2,
    record,
    lastPlayed: h2h?.lastPlayed ?? null,
    courseBreakdown: h2h?.courseBreakdown ?? null,
    recentGames: recentGames.map((g) => ({
      id: g.id,
      name: g.name,
      course: g.course?.courseName,
      date: g.endDate,
      player1Position: g.players.find((p) => p.userId === user1)?.position,
      player2Position: g.players.find((p) => p.userId === user2)?.position,
    })),
  });
}
