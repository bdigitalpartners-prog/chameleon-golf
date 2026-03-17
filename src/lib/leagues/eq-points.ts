/**
 * EQ Points Calculation System
 * ============================
 * Weights golf scores by course difficulty and match score.
 * A 78 at a 95-match course earns more EQ Points than a 78 at a 60-match course.
 */

export function calculateEqPoints(
  score: number,
  par: number,
  matchScore: number,
  difficultyIndex: number
): { eqPoints: number; difficultyMult: number; matchMult: number } {
  // Base points: centered at 50, +2 per stroke under par, -1.5 per stroke over
  const strokeDiff = par - score;
  const basePoints = strokeDiff >= 0
    ? 50 + strokeDiff * 2
    : Math.max(10, 50 + strokeDiff * 1.5);

  // Difficulty multiplier: harder courses give more points (0.8x to 1.5x)
  const diffMult = Math.round((0.8 + (difficultyIndex / 100) * 0.7) * 100) / 100;

  // Match score bonus: better-matched courses give slight bonus (1.0x to 1.2x)
  const matchMult = Math.round((1.0 + (matchScore / 100) * 0.2) * 100) / 100;

  const eqPoints = Math.max(0, Math.round(basePoints * diffMult * matchMult * 100) / 100);

  return { eqPoints, difficultyMult: diffMult, matchMult };
}

export interface StandingEntry {
  userId: string;
  totalPoints: number;
  roundsPlayed: number;
  avgEqPoints: number;
  rank: number;
}

export function calculateStandings(
  rounds: Array<{ userId: string; eqPoints: number }>
): StandingEntry[] {
  const userMap = new Map<string, { total: number; count: number }>();

  for (const r of rounds) {
    const entry = userMap.get(r.userId) ?? { total: 0, count: 0 };
    entry.total += r.eqPoints;
    entry.count += 1;
    userMap.set(r.userId, entry);
  }

  const standings: StandingEntry[] = [];
  for (const [userId, data] of userMap) {
    standings.push({
      userId,
      totalPoints: Math.round(data.total * 100) / 100,
      roundsPlayed: data.count,
      avgEqPoints: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      rank: 0,
    });
  }

  standings.sort((a, b) => b.totalPoints - a.totalPoints);
  standings.forEach((s, i) => (s.rank = i + 1));

  return standings;
}
