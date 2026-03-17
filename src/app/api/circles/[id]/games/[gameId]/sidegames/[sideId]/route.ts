import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; gameId: string; sideId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const body = await req.json();
    const { results } = body;

    const sideGame = await prisma.sideGame.findUnique({ where: { id: params.sideId } });
    if (!sideGame || sideGame.gameId !== params.gameId) {
      return NextResponse.json({ error: "Side game not found" }, { status: 404 });
    }

    const updated = await prisma.sideGame.update({
      where: { id: params.sideId },
      data: { results },
    });

    return NextResponse.json({ sideGame: updated });
  } catch (error: any) {
    console.error("PATCH /api/circles/[id]/games/[gameId]/sidegames/[sideId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
