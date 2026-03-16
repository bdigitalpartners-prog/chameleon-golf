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

  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("mode") ?? "most_games";

  // Get all completed games in this circle
  const completedGames = await prisma.game.findMany({
    where: { circleId: params.id, status: "COMPLETED" },
    include: {
      players: {
        where: { status: "CONFIRMED" },
        select: { userId: true, position: true },
      },
      scores: true,
    },
  });

  // Build player stats
  const statsMap = new Map<string, {
    gamesPlayed: number;
    totalStrokes: number;
    totalHoles: number;
    wins: number;
    coursesPlayed: Set<number>;
  }>();

  for (const game of completedGames) {
    for (const player of game.players) {
      if (!statsMap.has(player.userId)) {
        statsMap.set(player.userId, {
          gamesPlayed: 0,
          totalStrokes: 0,
          totalHoles: 0,
          wins: 0,
          coursesPlayed: new Set(),
        });
      }
      const s = statsMap.get(player.userId)!;
      s.gamesPlayed++;
      if (player.position === 1) s.wins++;
      if (game.courseId) s.coursesPlayed.add(game.courseId);

      const playerScores = game.scores.filter((sc) => sc.userId === player.userId);
      s.totalStrokes += playerScores.reduce((sum, sc) => sum + sc.strokes, 0);
      s.totalHoles += playerScores.length;
    }
  }

  // Get user info for all tracked players
  const userIds = Array.from(statsMap.keys());
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  let leaderboard = userIds.map((uid) => {
    const s = statsMap.get(uid)!;
    const u = userMap.get(uid);
    return {
      userId: uid,
      name: u?.name ?? "Unknown",
      image: u?.image ?? null,
      gamesPlayed: s.gamesPlayed,
      avgScore: s.totalHoles > 0 ? Math.round((s.totalStrokes / s.totalHoles) * 18 * 10) / 10 : 0,
      wins: s.wins,
      coursesPlayed: s.coursesPlayed.size,
    };
  });

  // Sort by selected mode
  switch (mode) {
    case "most_games":
      leaderboard.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
      break;
    case "best_avg_score":
      leaderboard = leaderboard.filter((l) => l.avgScore > 0);
      leaderboard.sort((a, b) => a.avgScore - b.avgScore);
      break;
    case "most_wins":
      leaderboard.sort((a, b) => b.wins - a.wins);
      break;
    case "most_courses":
      leaderboard.sort((a, b) => b.coursesPlayed - a.coursesPlayed);
      break;
    default:
      leaderboard.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  }

  return NextResponse.json({ leaderboard, mode });
}
