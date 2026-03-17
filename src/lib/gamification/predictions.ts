import prisma from '@/lib/prisma';
import { earnTokens } from './tokens';

interface PredictionResult {
  accuracy: number;
  beatAlgorithm: boolean;
  tokensEarned: number;
  eqBaseline: number;
  difference: number;
  algorithmDifference: number;
}

/**
 * Calculate the EQ baseline prediction for a course given a user's handicap.
 * Uses course difficulty data (slope, rating) combined with user handicap.
 * Formula: course par + (handicapIndex * slopeRating / 113)
 */
export async function calculateEqBaseline(
  courseId: number,
  userId: string
): Promise<number> {
  const [course, user] = await Promise.all([
    prisma.course.findUnique({
      where: { courseId },
      include: { difficulty: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { handicapIndex: true },
    }),
  ]);

  if (!course) throw new Error('Course not found');

  const par = course.par ?? 72;
  const handicap = user?.handicapIndex ? Number(user.handicapIndex) : 18;

  // If we have difficulty data, use slope-based calculation
  if (course.difficulty) {
    const slopeRating = course.difficulty.slopeRating ?? 113;
    const courseRating = course.difficulty.courseRating
      ? Number(course.difficulty.courseRating)
      : par;

    // USGA formula: Course Rating + (Handicap Index * Slope Rating / 113)
    const expectedScore = courseRating + (handicap * slopeRating) / 113;
    return Math.round(expectedScore);
  }

  // Fallback: simple par + handicap
  return Math.round(par + handicap);
}

/**
 * Score a completed prediction and award tokens based on accuracy.
 */
export async function scorePrediction(
  predictionId: string,
  actualScore: number
): Promise<PredictionResult> {
  const prediction = await prisma.prediction.findUnique({
    where: { id: predictionId },
    include: {
      course: { include: { difficulty: true } },
      user: { select: { id: true, handicapIndex: true } },
    },
  });

  if (!prediction) throw new Error('Prediction not found');
  if (prediction.status === 'completed') throw new Error('Prediction already scored');

  const predictedScore = prediction.predictedScore;
  const eqBaseline = prediction.eqBaseline ?? await calculateEqBaseline(
    prediction.courseId,
    prediction.userId
  );

  // Calculate accuracy: how close the prediction was to actual
  const difference = Math.abs(actualScore - predictedScore);
  const algorithmDifference = Math.abs(actualScore - eqBaseline);

  // Accuracy percentage: 100% if exact, decreasing by 10% per stroke off
  const accuracy = Math.max(0, 100 - difference * 10);

  // Did the user's prediction beat the algorithm?
  const beatAlgorithm = difference < algorithmDifference;

  // Token rewards based on accuracy
  let tokenReward = 0;
  if (difference === 0) {
    tokenReward = 50; // Perfect prediction
  } else if (difference <= 1) {
    tokenReward = 30; // Within 1 stroke
  } else if (difference <= 2) {
    tokenReward = 20; // Within 2 strokes
  } else if (difference <= 3) {
    tokenReward = 10; // Within 3 strokes
  } else if (difference <= 5) {
    tokenReward = 5; // Within 5 strokes
  }

  // Bonus for beating the algorithm
  if (beatAlgorithm) {
    tokenReward += 15;
  }

  // Update the prediction record
  await prisma.prediction.update({
    where: { id: predictionId },
    data: {
      actualScore,
      accuracy,
      beatAlgorithm,
      status: 'completed',
      tokensEarned: tokenReward,
      eqBaseline: eqBaseline,
    },
  });

  // Award tokens if any earned
  if (tokenReward > 0) {
    await earnTokens(
      prediction.userId,
      'PREDICTION',
      tokenReward,
      `Prediction scored: ${accuracy}% accuracy${beatAlgorithm ? ' (beat the algorithm!)' : ''}`
    );
  }

  return {
    accuracy,
    beatAlgorithm,
    tokensEarned: tokenReward,
    eqBaseline,
    difference,
    algorithmDifference,
  };
}

/**
 * Get prediction stats for a user.
 */
export async function getPredictionStats(userId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { userId, status: 'completed' },
  });

  if (predictions.length === 0) {
    return {
      totalPredictions: 0,
      completedPredictions: 0,
      averageAccuracy: 0,
      beatAlgorithmCount: 0,
      beatAlgorithmRate: 0,
      perfectPredictions: 0,
      totalTokensEarned: 0,
    };
  }

  const totalPredictions = await prisma.prediction.count({ where: { userId } });
  const averageAccuracy =
    predictions.reduce((sum, p) => sum + Number(p.accuracy ?? 0), 0) /
    predictions.length;
  const beatAlgorithmCount = predictions.filter((p) => p.beatAlgorithm).length;
  const perfectPredictions = predictions.filter(
    (p) => p.actualScore === p.predictedScore
  ).length;
  const totalTokensEarned = predictions.reduce(
    (sum, p) => sum + p.tokensEarned,
    0
  );

  return {
    totalPredictions,
    completedPredictions: predictions.length,
    averageAccuracy: Math.round(averageAccuracy * 10) / 10,
    beatAlgorithmCount,
    beatAlgorithmRate:
      predictions.length > 0
        ? Math.round((beatAlgorithmCount / predictions.length) * 100)
        : 0,
    perfectPredictions,
    totalTokensEarned,
  };
}
