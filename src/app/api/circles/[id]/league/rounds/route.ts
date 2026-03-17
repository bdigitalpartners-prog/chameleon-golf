import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { calculateEqPoints } from "@/lib/leagues/eq-points";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const { seasonId, courseId, score, playDate } = await req.json();
    if (!seasonId || !courseId || !score || !playDate) {
      return NextResponse.json({ error: "seasonId, courseId, score, and playDate are required" }, { status: 400 });
    }

    // Get course difficulty and match score
    const [difficulty, chameleonScore] = await Promise.all([
      prisma.courseDifficulty.findUnique({ where: { courseId } }),
      prisma.chameleonScore.findUnique({ where: { courseId } }),
    ]);

    const course = await prisma.course.findUnique({ where: { courseId }, select: { par: true } });
    const par = course?.par ?? 72;
    const diffIndex = difficulty ? Number(difficulty.trueDifficultyIndex) : 50;
    const matchScore = chameleonScore ? Number(chameleonScore.chameleonScore) : 50;

    const { eqPoints, difficultyMult } = calculateEqPoints(score, par, matchScore, diffIndex);

    const round = await prisma.$transaction(async (tx) => {
      const newRound = await tx.leagueRound.create({
        data: {
          seasonId,
          userId,
          courseId,
          score,
          eqPoints,
          matchScore,
          difficultyMult: difficultyMult,
          playDate: new Date(playDate),
        },
      });

      // Upsert standings — handles new members who joined after season start
      const existing = await tx.leagueStanding.findUnique({
        where: { seasonId_userId: { seasonId, userId } },
      });

      if (existing) {
        const newTotal = Number(existing.totalPoints) + eqPoints;
        const newRoundsPlayed = existing.roundsPlayed + 1;
        await tx.leagueStanding.update({
          where: { id: existing.id },
          data: {
            totalPoints: newTotal,
            roundsPlayed: newRoundsPlayed,
            avgEqPoints: newTotal / newRoundsPlayed,
          },
        });
      } else {
        await tx.leagueStanding.create({
          data: {
            seasonId,
            userId,
            totalPoints: eqPoints,
            roundsPlayed: 1,
            avgEqPoints: eqPoints,
          },
        });
      }

      return newRound;
    });

    return NextResponse.json({ round, eqPoints }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/league/rounds error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    const rounds = await prisma.leagueRound.findMany({
      where: {
        season: { circleId: params.id },
        ...(seasonId ? { seasonId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        course: { select: { courseId: true, courseName: true } },
      },
      orderBy: { playDate: "desc" },
    });

    return NextResponse.json({ rounds });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/league/rounds error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
