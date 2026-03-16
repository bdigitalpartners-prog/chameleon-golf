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

  if (game.status !== "IN_PROGRESS" && game.status !== "SETUP" && game.status !== "OPEN") {
    return NextResponse.json({ error: "Game is not accepting scores" }, { status: 400 });
  }

  const body = await req.json();
  const { scores, targetUserId } = body;
  const scoringUserId = targetUserId ?? userId;

  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json({ error: "Scores array is required" }, { status: 400 });
  }

  // Auto-transition to IN_PROGRESS if first scores submitted
  if (game.status === "SETUP" || game.status === "OPEN") {
    await prisma.game.update({
      where: { id: params.gameId },
      data: { status: "IN_PROGRESS" },
    });
  }

  const results = [];
  for (const s of scores) {
    if (!s.holeNumber || !s.strokes) continue;
    const score = await prisma.gameScore.upsert({
      where: {
        gameId_userId_holeNumber: {
          gameId: params.gameId,
          userId: scoringUserId,
          holeNumber: s.holeNumber,
        },
      },
      update: {
        strokes: s.strokes,
        putts: s.putts ?? null,
        penalties: s.penalties ?? null,
        fairwayHit: s.fairwayHit ?? null,
        greenInReg: s.greenInReg ?? null,
      },
      create: {
        gameId: params.gameId,
        userId: scoringUserId,
        holeNumber: s.holeNumber,
        strokes: s.strokes,
        putts: s.putts ?? null,
        penalties: s.penalties ?? null,
        fairwayHit: s.fairwayHit ?? null,
        greenInReg: s.greenInReg ?? null,
      },
    });
    results.push(score);
  }

  return NextResponse.json({ scores: results });
}

export async function GET(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

  const scores = await prisma.gameScore.findMany({
    where: { gameId: params.gameId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: [{ userId: "asc" }, { holeNumber: "asc" }],
  });

  return NextResponse.json({ scores });
}
