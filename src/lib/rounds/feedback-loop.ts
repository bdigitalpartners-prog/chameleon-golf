import prisma from '@/lib/prisma';

interface DimensionAdjustment {
  dimension: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

interface PerformanceInsight {
  courseId: number;
  courseName: string;
  predictedDifficulty: 'easy' | 'moderate' | 'hard';
  actualDifficulty: 'easy' | 'moderate' | 'hard';
  differential: number;
  averageDifferential: number;
  deviation: number;
}

export interface FeedbackResult {
  totalRounds: number;
  averageDifferential: number;
  insights: PerformanceInsight[];
  adjustments: DimensionAdjustment[];
  accuracyScore: number;
}

/**
 * Analyzes round data to provide feedback for EQ Score accuracy improvement.
 * Compares predicted vs actual performance at courses to identify which
 * scoring dimensions may need adjustment for the user.
 */
export async function analyzeRoundFeedback(userId: string): Promise<FeedbackResult> {
  const rounds = await prisma.roundHistory.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          chameleonScores: true,
        },
      },
    },
    orderBy: { playDate: 'desc' },
    take: 20,
  });

  if (rounds.length === 0) {
    return {
      totalRounds: 0,
      averageDifferential: 0,
      insights: [],
      adjustments: [],
      accuracyScore: 0,
    };
  }

  // Calculate average differential across all rounds
  const differentials = rounds
    .filter((r) => r.differential !== null)
    .map((r) => Number(r.differential));
  const averageDifferential =
    differentials.length > 0
      ? differentials.reduce((sum, d) => sum + d, 0) / differentials.length
      : 0;

  // Generate performance insights by comparing actual round differential
  // against the user's average to infer course-specific difficulty
  const insights: PerformanceInsight[] = rounds
    .filter((r) => r.differential !== null && r.course)
    .map((r) => {
      const diff = Number(r.differential);
      const deviation = diff - averageDifferential;

      // Classify predicted difficulty based on course slope rating
      const slopeRating = r.slopeRating ?? 113;
      const predictedDifficulty: 'easy' | 'moderate' | 'hard' =
        slopeRating < 110 ? 'easy' : slopeRating < 130 ? 'moderate' : 'hard';

      // Classify actual difficulty based on how differential compares to average
      const actualDifficulty: 'easy' | 'moderate' | 'hard' =
        deviation < -2 ? 'easy' : deviation > 2 ? 'hard' : 'moderate';

      return {
        courseId: r.courseId,
        courseName: r.course?.courseName ?? 'Unknown',
        predictedDifficulty,
        actualDifficulty,
        differential: diff,
        averageDifferential,
        deviation: Math.round(deviation * 10) / 10,
      };
    });

  // Analyze mismatches to suggest dimension adjustments
  const adjustments: DimensionAdjustment[] = [];

  // Count how often predicted vs actual difficulty diverge
  const mismatches = insights.filter(
    (i) => i.predictedDifficulty !== i.actualDifficulty,
  );
  const mismatchRate = insights.length > 0 ? mismatches.length / insights.length : 0;

  // If the user consistently scores better at hard courses, suggest
  // increasing the challenge weight in their EQ profile
  const hardCoursesPlayedWell = insights.filter(
    (i) => i.predictedDifficulty === 'hard' && i.actualDifficulty !== 'hard',
  );
  if (hardCoursesPlayedWell.length >= 2) {
    adjustments.push({
      dimension: 'challenge',
      currentWeight: 50,
      suggestedWeight: 65,
      reason: `You performed better than expected at ${hardCoursesPlayedWell.length} challenging courses. Consider increasing your Challenge weight.`,
    });
  }

  // If the user struggles at easy courses, conditioning may be affecting play
  const easyCoursesStruggled = insights.filter(
    (i) => i.predictedDifficulty === 'easy' && i.actualDifficulty === 'hard',
  );
  if (easyCoursesStruggled.length >= 2) {
    adjustments.push({
      dimension: 'conditioning',
      currentWeight: 50,
      suggestedWeight: 70,
      reason: `You scored higher than expected at ${easyCoursesStruggled.length} easier courses. Course conditioning may matter more to your game.`,
    });
  }

  // If consistent deviation pattern exists, suggest layout/design awareness
  const highDeviation = insights.filter((i) => Math.abs(i.deviation) > 3);
  if (highDeviation.length >= 3) {
    adjustments.push({
      dimension: 'layout',
      currentWeight: 50,
      suggestedWeight: 60,
      reason: `Your scores vary significantly across courses. Layout and design may affect your game more than average.`,
    });
  }

  // Calculate overall accuracy score (0-100) based on how well predictions match
  const accuracyScore = Math.round((1 - mismatchRate) * 100);

  return {
    totalRounds: rounds.length,
    averageDifferential: Math.round(averageDifferential * 10) / 10,
    insights,
    adjustments,
    accuracyScore,
  };
}
