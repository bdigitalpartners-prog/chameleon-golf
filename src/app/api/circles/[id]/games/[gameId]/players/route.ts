import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const game = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!game || game.circleId !== params.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status === "COMPLETED" || game.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot join a finished game" }, { status: 400 });
  }

  const body = await req.json();
  const targetUserId = body.userId ?? userId;
  const { team, handicap, status } = body;

  // Verify target user is a circle member
  const membership = await prisma.circleMembership.findUnique({
    where: { circleId_userId: { circleId: params.id, userId: targetUserId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "User is not a circle member" }, { status: 400 });
  }

  const player = await prisma.gamePlayer.upsert({
    where: { gameId_userId: { gameId: params.gameId, userId: targetUserId } },
    update: {
      team: team ?? undefined,
      handicap: handicap ?? undefined,
      status: status ?? "CONFIRMED",
    },
    create: {
      gameId: params.gameId,
      userId: targetUserId,
      team: team ?? null,
      handicap: handicap ?? null,
      status: status ?? "CONFIRMED",
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ player }, { status: 201 });
}
