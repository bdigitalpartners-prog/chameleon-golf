import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; gameId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUserId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, currentUserId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const body = await req.json();
  const { team, handicap, status } = body;

  // Authorization for handicap changes: only the player themselves, game creator, or circle admin
  if (handicap !== undefined) {
    const game = await prisma.game.findUnique({ where: { id: params.gameId } });
    if (!game || game.circleId !== params.id) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const isSelf = params.userId === currentUserId;
    const isGameCreator = game.createdById === currentUserId;
    const isAdmin = auth.membership?.role === "OWNER" || auth.membership?.role === "ADMIN";
    if (!isSelf && !isGameCreator && !isAdmin) {
      return NextResponse.json({ error: "Not authorized to change this player's handicap" }, { status: 403 });
    }
  }

  const player = await prisma.gamePlayer.findUnique({
    where: { gameId_userId: { gameId: params.gameId, userId: params.userId } },
  });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const updated = await prisma.gamePlayer.update({
    where: { id: player.id },
    data: {
      ...(team !== undefined && { team }),
      ...(handicap !== undefined && { handicap }),
      ...(status !== undefined && { status }),
    },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ player: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; gameId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUserId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, currentUserId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const game = await prisma.game.findUnique({ where: { id: params.gameId } });
  if (!game || game.circleId !== params.id) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Only self, game creator, or admins can remove players
  if (
    params.userId !== currentUserId &&
    game.createdById !== currentUserId &&
    auth.membership?.role !== "OWNER" &&
    auth.membership?.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Not authorized to remove this player" }, { status: 403 });
  }

  await prisma.gamePlayer.deleteMany({
    where: { gameId: params.gameId, userId: params.userId },
  });

  return NextResponse.json({ success: true });
}
