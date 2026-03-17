import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withCircleAuth } from "@/lib/circle-auth";
import { calculateLeaderboard, updateHeadToHead } from "@/lib/game-scoring";
import { fanOutToCircle } from "@/lib/feed";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string; gameId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const auth = await withCircleAuth(params.id, userId, ["OWNER", "ADMIN", "MEMBER"]);
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: { players: true, scores: true, course: { select: { courseName: true } } },
    });

    if (!game || game.circleId !== params.id) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.createdById !== userId && auth.membership?.role !== "OWNER" && auth.membership?.role !== "ADMIN") {
      return NextResponse.json({ error: "Only the game creator or admins can complete the game" }, { status: 403 });
    }

    if (game.status === "COMPLETED") {
      return NextResponse.json({ error: "Game is already completed" }, { status: 400 });
    }

    // Get hole pars if course has hole data (needed for Stableford scoring)
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

    // Calculate final results
    const leaderboard = calculateLeaderboard(game, game.scores, game.players, holePars);

    const resultsSummary = leaderboard.map((e) => ({
      userId: e.userId,
      position: e.position,
      totalStrokes: e.totalStrokes,
      netStrokes: e.netStrokes,
      points: e.points,
      skins: e.skins,
    }));

    // Wrap all game completion writes in a transaction
    await prisma.$transaction(async (tx) => {
      // Update player positions
      for (const entry of leaderboard) {
        await tx.gamePlayer.updateMany({
          where: { gameId: params.gameId, userId: entry.userId },
          data: { position: entry.position },
        });
      }

      // Mark game as completed with results
      await tx.game.update({
        where: { id: params.gameId },
        data: {
          status: "COMPLETED",
          endDate: new Date(),
          results: resultsSummary,
        },
      });
    });

    // Update H2H records (outside transaction — uses its own queries)
    await updateHeadToHead(params.gameId, params.id);

    // Auto-post results to circle feed
    const winner = leaderboard[0];
    const winnerUser = await prisma.user.findUnique({
      where: { id: winner?.userId },
      select: { name: true },
    });

    const formatLabel = game.format.replace("_", " ");
    const courseName = game.course?.courseName ?? "Unknown Course";
    const playerCount = game.players.filter((p) => p.status === "CONFIRMED").length;

    const content = `🏆 Game Complete: ${game.name ?? formatLabel}\n\n` +
      `📍 ${courseName} | ${formatLabel} | ${playerCount} players\n\n` +
      `🥇 Winner: ${winnerUser?.name ?? "Unknown"}\n\n` +
      leaderboard
        .slice(0, 5)
        .map((e, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          return `${medal} ${e.userName ?? "Player"}: ${e.totalStrokes} strokes${e.points !== undefined ? ` (${e.points} pts)` : ""}`;
        })
        .join("\n");

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        circleId: params.id,
        content,
        type: "ROUND_RECAP",
        courseId: game.courseId ?? undefined,
      },
    });

    await fanOutToCircle({
      circleId: params.id,
      type: "POST_CREATED",
      actorId: userId,
      postId: post.id,
    });

    // Notify all players
    const confirmedPlayers = game.players.filter((p) => p.status === "CONFIRMED");
    for (const player of confirmedPlayers) {
      if (player.userId === userId) continue;
      const playerResult = leaderboard.find((e) => e.userId === player.userId);
      await createNotification({
        userId: player.userId,
        type: "GAME_COMPLETED",
        title: `Game Complete: ${game.name ?? formatLabel}`,
        body: `You finished #${playerResult?.position ?? "?"} at ${courseName}`,
        actionUrl: `/circles/${params.id}/games/${params.gameId}`,
      });
    }

    return NextResponse.json({ success: true, leaderboard, post: { id: post.id } });
  } catch (error: any) {
    console.error("POST /api/circles/[id]/games/[gameId]/complete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
