import prisma from "./prisma";
import { GameFormat, Game, GameScore, GamePlayer } from "@prisma/client";

export interface LeaderboardEntry {
  userId: string;
  userName?: string;
  team?: string | null;
  totalStrokes: number;
  netStrokes?: number;
  holesCompleted: number;
  position: number;
  thru: number;
  // Format-specific
  points?: number;
  skins?: number;
  matchStatus?: string;
  nassau?: { front: number; back: number; overall: number };
  holeScores?: number[];
}

// Stableford point values: eagle-or-better=4, birdie=3, par=2, bogey=1, double+=0
function stablefordPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -2) return 4;
  if (diff === -1) return 3;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}

export function calculateLeaderboard(
  game: Game & { players?: GamePlayer[] },
  scores: GameScore[],
  players: GamePlayer[],
  holePars?: number[]
): LeaderboardEntry[] {
  switch (game.format) {
    case "STROKE_PLAY":
      return calcStrokePlay(game, scores, players);
    case "SKINS":
      return calcSkins(game, scores, players);
    case "NASSAU":
      return calcNassau(game, scores, players);
    case "MATCH_PLAY":
      return calcMatchPlay(game, scores, players);
    case "STABLEFORD":
      return calcStableford(game, scores, players, holePars);
    case "BEST_BALL":
      return calcBestBall(game, scores, players);
    case "SCRAMBLE":
      return calcScramble(game, scores, players);
    default:
      return calcStrokePlay(game, scores, players);
  }
}

function calcStrokePlay(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[]
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = players.map((p) => {
    const playerScores = scores
      .filter((s) => s.userId === p.userId)
      .sort((a, b) => a.holeNumber - b.holeNumber);
    const total = playerScores.reduce((sum, s) => sum + s.strokes, 0);
    const net = p.handicap ? Math.round(total - (p.handicap ?? 0)) : total;
    return {
      userId: p.userId,
      team: p.team,
      totalStrokes: total,
      netStrokes: net,
      holesCompleted: playerScores.length,
      thru: playerScores.length,
      position: 0,
      holeScores: playerScores.map((s) => s.strokes),
    };
  });

  entries.sort((a, b) => (a.netStrokes ?? a.totalStrokes) - (b.netStrokes ?? b.totalStrokes));
  entries.forEach((e, i) => (e.position = i + 1));
  return entries;
}

function calcSkins(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[]
): LeaderboardEntry[] {
  const config = (game.config as any) ?? {};
  const carryover = config.skinCarryover ?? true;
  const skinMap: Record<string, number> = {};
  players.forEach((p) => (skinMap[p.userId] = 0));

  let carried = 0;
  for (let hole = 1; hole <= game.holesPlayed; hole++) {
    const holeScores = players
      .map((p) => ({
        userId: p.userId,
        strokes: scores.find((s) => s.userId === p.userId && s.holeNumber === hole)?.strokes ?? Infinity,
      }))
      .filter((s) => s.strokes !== Infinity);

    if (holeScores.length === 0) continue;

    const min = Math.min(...holeScores.map((s) => s.strokes));
    const winners = holeScores.filter((s) => s.strokes === min);

    if (winners.length === 1) {
      skinMap[winners[0].userId] += 1 + carried;
      carried = 0;
    } else if (carryover) {
      carried += 1;
    }
  }

  const entries: LeaderboardEntry[] = players.map((p) => {
    const playerScores = scores.filter((s) => s.userId === p.userId);
    return {
      userId: p.userId,
      team: p.team,
      totalStrokes: playerScores.reduce((sum, s) => sum + s.strokes, 0),
      holesCompleted: playerScores.length,
      thru: playerScores.length,
      position: 0,
      skins: skinMap[p.userId] ?? 0,
    };
  });

  entries.sort((a, b) => (b.skins ?? 0) - (a.skins ?? 0));
  entries.forEach((e, i) => (e.position = i + 1));
  return entries;
}

function calcNassau(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[]
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = players.map((p) => {
    const playerScores = scores
      .filter((s) => s.userId === p.userId)
      .sort((a, b) => a.holeNumber - b.holeNumber);
    const front = playerScores.filter((s) => s.holeNumber <= 9).reduce((s, sc) => s + sc.strokes, 0);
    const back = playerScores.filter((s) => s.holeNumber > 9).reduce((s, sc) => s + sc.strokes, 0);
    const overall = front + back;
    const handicap = p.handicap ?? 0;
    return {
      userId: p.userId,
      team: p.team,
      totalStrokes: overall,
      netStrokes: Math.round(overall - handicap),
      holesCompleted: playerScores.length,
      thru: playerScores.length,
      position: 0,
      nassau: {
        front: Math.round(front - handicap / 2),
        back: Math.round(back - handicap / 2),
        overall: Math.round(overall - handicap),
      },
    };
  });

  entries.sort((a, b) => (a.nassau?.overall ?? 0) - (b.nassau?.overall ?? 0));
  entries.forEach((e, i) => (e.position = i + 1));
  return entries;
}

function calcMatchPlay(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[]
): LeaderboardEntry[] {
  // Match play: track holes won vs opponent(s)
  const entries: LeaderboardEntry[] = players.map((p) => {
    const playerScores = scores.filter((s) => s.userId === p.userId);
    let holesWon = 0;
    for (let hole = 1; hole <= game.holesPlayed; hole++) {
      const myScore = scores.find((s) => s.userId === p.userId && s.holeNumber === hole);
      if (!myScore) continue;
      const opponents = players.filter((op) => op.userId !== p.userId);
      const allBeat = opponents.every((op) => {
        const opScore = scores.find((s) => s.userId === op.userId && s.holeNumber === hole);
        return opScore ? myScore.strokes < opScore.strokes : false;
      });
      if (allBeat) holesWon++;
    }
    return {
      userId: p.userId,
      team: p.team,
      totalStrokes: playerScores.reduce((s, sc) => s + sc.strokes, 0),
      holesCompleted: playerScores.length,
      thru: playerScores.length,
      position: 0,
      points: holesWon,
      matchStatus: `${holesWon} UP`,
    };
  });

  entries.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  entries.forEach((e, i) => (e.position = i + 1));
  // Update match status relative to leader
  if (entries.length >= 2) {
    const diff = (entries[0].points ?? 0) - (entries[1].points ?? 0);
    const remaining = game.holesPlayed - Math.max(entries[0].thru, entries[1].thru);
    entries[0].matchStatus = diff > 0 ? `${diff} UP` : diff === 0 ? "AS" : `${-diff} DN`;
    entries.slice(1).forEach((e) => {
      const d = (entries[0].points ?? 0) - (e.points ?? 0);
      e.matchStatus = d > 0 ? `${d} DN` : d === 0 ? "AS" : `${-d} UP`;
    });
  }
  return entries;
}

function calcStableford(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[],
  holePars?: number[]
): LeaderboardEntry[] {
  const defaultPar = 4;
  const entries: LeaderboardEntry[] = players.map((p) => {
    const playerScores = scores
      .filter((s) => s.userId === p.userId)
      .sort((a, b) => a.holeNumber - b.holeNumber);
    let totalPoints = 0;
    playerScores.forEach((s) => {
      const par = holePars?.[s.holeNumber - 1] ?? defaultPar;
      totalPoints += stablefordPoints(s.strokes, par);
    });
    return {
      userId: p.userId,
      team: p.team,
      totalStrokes: playerScores.reduce((sum, s) => sum + s.strokes, 0),
      holesCompleted: playerScores.length,
      thru: playerScores.length,
      position: 0,
      points: totalPoints,
    };
  });

  entries.sort((a, b) => (b.points ?? 0) - (a.points ?? 0)); // Higher is better
  entries.forEach((e, i) => (e.position = i + 1));
  return entries;
}

function calcBestBall(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[]
): LeaderboardEntry[] {
  // Group by team
  const teams = new Map<string, GamePlayer[]>();
  players.forEach((p) => {
    const team = p.team ?? p.userId;
    if (!teams.has(team)) teams.set(team, []);
    teams.get(team)!.push(p);
  });

  const teamEntries: LeaderboardEntry[] = [];
  for (const [team, teamPlayers] of teams) {
    let totalBest = 0;
    let holesCompleted = 0;
    for (let hole = 1; hole <= game.holesPlayed; hole++) {
      const holeScores = teamPlayers
        .map((p) => scores.find((s) => s.userId === p.userId && s.holeNumber === hole)?.strokes)
        .filter((s): s is number => s !== undefined);
      if (holeScores.length > 0) {
        totalBest += Math.min(...holeScores);
        holesCompleted++;
      }
    }
    teamEntries.push({
      userId: teamPlayers[0].userId,
      team,
      totalStrokes: totalBest,
      holesCompleted,
      thru: holesCompleted,
      position: 0,
    });
  }

  teamEntries.sort((a, b) => a.totalStrokes - b.totalStrokes);
  teamEntries.forEach((e, i) => (e.position = i + 1));
  return teamEntries;
}

function calcScramble(
  game: Game,
  scores: GameScore[],
  players: GamePlayer[]
): LeaderboardEntry[] {
  // Scramble: team uses one score per hole (any team member enters it)
  const teams = new Map<string, GamePlayer[]>();
  players.forEach((p) => {
    const team = p.team ?? p.userId;
    if (!teams.has(team)) teams.set(team, []);
    teams.get(team)!.push(p);
  });

  const teamEntries: LeaderboardEntry[] = [];
  for (const [team, teamPlayers] of teams) {
    // In scramble, the score entered is the team score; take any player's score per hole
    let total = 0;
    let holesCompleted = 0;
    for (let hole = 1; hole <= game.holesPlayed; hole++) {
      const holeScore = teamPlayers
        .map((p) => scores.find((s) => s.userId === p.userId && s.holeNumber === hole)?.strokes)
        .filter((s): s is number => s !== undefined);
      if (holeScore.length > 0) {
        total += Math.min(...holeScore);
        holesCompleted++;
      }
    }
    teamEntries.push({
      userId: teamPlayers[0].userId,
      team,
      totalStrokes: total,
      holesCompleted,
      thru: holesCompleted,
      position: 0,
    });
  }

  teamEntries.sort((a, b) => a.totalStrokes - b.totalStrokes);
  teamEntries.forEach((e, i) => (e.position = i + 1));
  return teamEntries;
}

export async function updateHeadToHead(gameId: string, circleId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: true, scores: true },
  });
  if (!game || game.status !== "COMPLETED") return;

  const leaderboard = calculateLeaderboard(game, game.scores, game.players);
  const confirmedPlayers = game.players.filter((p) => p.status === "CONFIRMED");

  for (let i = 0; i < confirmedPlayers.length; i++) {
    for (let j = i + 1; j < confirmedPlayers.length; j++) {
      const p1 = confirmedPlayers[i];
      const p2 = confirmedPlayers[j];

      // Ensure consistent ordering: userId1 < userId2
      const [userId1, userId2] = p1.userId < p2.userId ? [p1.userId, p2.userId] : [p2.userId, p1.userId];
      const pos1 = leaderboard.find((e) => e.userId === userId1)?.position ?? 0;
      const pos2 = leaderboard.find((e) => e.userId === userId2)?.position ?? 0;

      const existing = await prisma.headToHead.findUnique({
        where: { userId1_userId2_circleId: { userId1, userId2, circleId } },
      });

      const win1 = pos1 < pos2 ? 1 : 0;
      const win2 = pos2 < pos1 ? 1 : 0;
      const tie = pos1 === pos2 ? 1 : 0;

      if (existing) {
        await prisma.headToHead.update({
          where: { id: existing.id },
          data: {
            wins1: existing.wins1 + win1,
            wins2: existing.wins2 + win2,
            ties: existing.ties + tie,
            lastPlayed: new Date(),
          },
        });
      } else {
        await prisma.headToHead.create({
          data: {
            userId1,
            userId2,
            circleId,
            wins1: win1,
            wins2: win2,
            ties: tie,
            lastPlayed: new Date(),
          },
        });
      }
    }
  }
}
