import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const game = await prisma.game.findUnique({ where: { id: params.gameId } });
    if (!game || game.circleId !== params.id) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, type, stakes, holeNumber } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const sideGame = await prisma.sideGame.create({
      data: {
        gameId: params.gameId,
        name,
        type,
        stakes: stakes ?? null,
        holeNumber: holeNumber ?? null,
      },
    });

    return NextResponse.json({ sideGame }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/games/[gameId]/sidegames error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
