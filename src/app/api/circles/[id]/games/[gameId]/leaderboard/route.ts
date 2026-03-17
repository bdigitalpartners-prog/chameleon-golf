import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { calculateLeaderboard } from "@/lib/game-scoring";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        players: { include: { user: { select: { id: true, name: true, image: true } } } },
        scores: true,
        course: { select: { courseId: true, par: true } },
      },
    });

    if (!game || game.circleId !== params.id) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get hole pars if course has hole data
    let holePars: number[] | undefined;
    if (game.courseId) {
      const holes = await prisma.hole.findMany({
        where: { courseId: game.courseId },
        orderBy: { holeNumber: "asc" },
        select: { par: true },
      });
      if (holes.length > 0) {
        holePars = holes.map((h) => h.par);
      }
    }

    const leaderboard = calculateLeaderboard(game, game.scores, game.players, holePars);

    // Enrich with user info
    const enriched = leaderboard.map((entry) => {
      const player = game.players.find((p) => p.userId === entry.userId);
      return {
        ...entry,
        userName: player?.user?.name ?? "Unknown",
        userImage: (player?.user as any)?.image ?? null,
      };
    });

    return NextResponse.json({ leaderboard: enriched, format: game.format });
  } catch (error: any) {
    console.error("GET /api/circles/[id]/games/[gameId]/leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
