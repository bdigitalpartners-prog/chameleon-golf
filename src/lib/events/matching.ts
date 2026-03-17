import prisma from '@/lib/prisma';

/**
 * Event Matching Logic
 * ====================
 * Calculates match scores for events based on the course's EQ (Chameleon) score
 * and checks handicap eligibility for individual users.
 */

export interface EventMatchResult {
  eventId: string;
  matchScore: number; // 0-100
  eligible: boolean;
  reasons: string[];
}

/**
 * Calculate a match score for an event based on its course's Chameleon Score.
 * Higher course EQ score = higher match score.
 *
 * @param courseId - The course ID linked to the event
 * @returns A numeric match score from 0 to 100
 */
export async function calculateEventMatchScore(courseId: number | null): Promise<number> {
  if (!courseId) return 50; // Default score when no course is linked

  const chameleonScore = await prisma.chameleonScore.findUnique({
    where: { courseId },
    select: { chameleonScore: true, avgOverall: true, prestigeScore: true },
  });

  if (!chameleonScore) return 50;

  // The chameleon_score column is already a 0-100 composite score
  const eqScore = Number(chameleonScore.chameleonScore) || 0;

  // Normalize: EQ scores typically range 0-100 but cluster 20-85
  // Map to a friendlier 0-100 match score
  const matchScore = Math.min(100, Math.max(0, Math.round(eqScore)));
  return matchScore;
}

/**
 * Check if a user is eligible for an event based on handicap restrictions.
 *
 * @param userHandicap - The user's handicap index (may be null)
 * @param maxHandicap - Event's maximum handicap (may be null = no restriction)
 * @param minHandicap - Event's minimum handicap (may be null = no restriction)
 * @returns Object with eligibility flag and reasons
 */
export function checkHandicapEligibility(
  userHandicap: number | null,
  maxHandicap: number | null,
  minHandicap: number | null,
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // No handicap restrictions on the event = everyone eligible
  if (maxHandicap === null && minHandicap === null) {
    reasons.push('Open to all handicaps');
    return { eligible: true, reasons };
  }

  // User has no handicap set — can't confirm eligibility
  if (userHandicap === null) {
    reasons.push('Set your handicap to check eligibility');
    return { eligible: false, reasons };
  }

  let eligible = true;

  if (maxHandicap !== null && userHandicap > maxHandicap) {
    eligible = false;
    reasons.push(`Max handicap ${maxHandicap} (yours: ${userHandicap})`);
  }

  if (minHandicap !== null && userHandicap < minHandicap) {
    eligible = false;
    reasons.push(`Min handicap ${minHandicap} (yours: ${userHandicap})`);
  }

  if (eligible) {
    reasons.push('Your handicap qualifies');
  }

  return { eligible, reasons };
}

/**
 * Compute full match result for a single event + user.
 */
export async function computeEventMatch(
  event: {
    id: string;
    courseId: number | null;
    maxHandicap: number | null;
    minHandicap: number | null;
  },
  userHandicap: number | null,
): Promise<EventMatchResult> {
  const matchScore = await calculateEventMatchScore(event.courseId);
  const { eligible, reasons } = checkHandicapEligibility(
    userHandicap,
    event.maxHandicap,
    event.minHandicap,
  );

  return {
    eventId: event.id,
    matchScore,
    eligible,
    reasons,
  };
}

/**
 * Count the number of active events a user qualifies for based on their handicap.
 */
export async function countEligibleEvents(userId: string): Promise<number> {
  // Fetch user handicap
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { handicapIndex: true },
  });

  const userHandicap = user?.handicapIndex ? Number(user.handicapIndex) : null;

  // Fetch active upcoming events
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      eventDate: { gte: now },
    },
    select: {
      id: true,
      maxHandicap: true,
      minHandicap: true,
    },
  });

  let count = 0;
  for (const event of events) {
    const max = event.maxHandicap ? Number(event.maxHandicap) : null;
    const min = event.minHandicap ? Number(event.minHandicap) : null;
    const { eligible } = checkHandicapEligibility(userHandicap, max, min);
    if (eligible) count++;
  }

  return count;
}
