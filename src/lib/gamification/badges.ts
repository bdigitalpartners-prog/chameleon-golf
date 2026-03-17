import prisma from '@/lib/prisma';
import { earnTokens } from './tokens';

interface BadgeCriteria {
  type: string;
  threshold: number;
  description: string;
}

/**
 * Check all badge criteria for a user and award any newly earned badges.
 * Returns a list of newly awarded badge names.
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const allBadges = await prisma.badge.findMany();
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));

  const newlyAwarded: string[] = [];

  for (const badge of allBadges) {
    // Skip already earned badges
    if (earnedBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria as BadgeCriteria | null;
    if (!criteria) continue;

    const qualifies = await checkBadgeCriteria(userId, criteria);
    if (qualifies) {
      await awardBadge(userId, badge.id, badge.name);
      newlyAwarded.push(badge.name);
    }
  }

  return newlyAwarded;
}

/**
 * Check if a user meets the criteria for a specific badge.
 */
async function checkBadgeCriteria(
  userId: string,
  criteria: BadgeCriteria
): Promise<boolean> {
  switch (criteria.type) {
    case 'courses_rated': {
      const count = await prisma.userCourseRating.count({
        where: { userId },
      });
      return count >= criteria.threshold;
    }

    case 'predictions_made': {
      const count = await prisma.prediction.count({
        where: { userId },
      });
      return count >= criteria.threshold;
    }

    case 'predictions_accurate': {
      const count = await prisma.prediction.count({
        where: {
          userId,
          status: 'completed',
          accuracy: { gte: 90 },
        },
      });
      return count >= criteria.threshold;
    }

    case 'beat_algorithm': {
      const count = await prisma.prediction.count({
        where: {
          userId,
          beatAlgorithm: true,
        },
      });
      return count >= criteria.threshold;
    }

    case 'challenges_completed': {
      const count = await prisma.userChallenge.count({
        where: {
          userId,
          status: 'completed',
        },
      });
      return count >= criteria.threshold;
    }

    case 'unique_courses_played': {
      const courses = await prisma.postedScore.findMany({
        where: { userId },
        distinct: ['courseId'],
        select: { courseId: true },
      });
      return courses.length >= criteria.threshold;
    }

    case 'rounds_posted': {
      const count = await prisma.postedScore.count({
        where: { userId },
      });
      return count >= criteria.threshold;
    }

    case 'intelligence_notes': {
      // Intelligence notes tracked via user course ratings with review text
      const count = await prisma.userCourseRating.count({
        where: { userId, reviewText: { not: null } },
      });
      return count >= criteria.threshold;
    }

    case 'states_played': {
      const states = await prisma.postedScore.findMany({
        where: { userId },
        include: {
          course: { select: { state: true } },
        },
      });
      const uniqueStates = new Set(
        states.map((s) => s.course.state).filter(Boolean)
      );
      return uniqueStates.size >= criteria.threshold;
    }

    case 'tokens_earned': {
      const result = await prisma.eqTokenTransaction.aggregate({
        where: { userId, type: 'EARNED' },
        _sum: { amount: true },
      });
      return (result._sum.amount ?? 0) >= criteria.threshold;
    }

    default:
      return false;
  }
}

/**
 * Award a specific badge to a user and grant achievement tokens.
 */
async function awardBadge(
  userId: string,
  badgeId: string,
  badgeName: string
): Promise<void> {
  await prisma.userBadge.create({
    data: {
      userId,
      badgeId,
      metadata: { awardedBy: 'system' },
    },
  });

  // Award tokens for earning a badge
  await earnTokens(
    userId,
    'ACHIEVEMENT',
    25,
    `Earned badge: ${badgeName}`
  );
}

/**
 * Get all badges with the user's earned status.
 */
export async function getBadgesWithStatus(userId: string) {
  const allBadges = await prisma.badge.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true, earnedAt: true },
  });

  const earnedMap = new Map(
    earnedBadges.map((ub) => [ub.badgeId, ub.earnedAt])
  );

  // Get total earners for rarity
  const badgeCounts = await prisma.userBadge.groupBy({
    by: ['badgeId'],
    _count: { badgeId: true },
  });
  const countMap = new Map(
    badgeCounts.map((bc) => [bc.badgeId, bc._count.badgeId])
  );
  const totalUsers = await prisma.user.count();

  return allBadges.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) ?? null,
    totalEarners: countMap.get(badge.id) ?? 0,
    rarity:
      totalUsers > 0
        ? Math.round(((countMap.get(badge.id) ?? 0) / totalUsers) * 100)
        : 0,
  }));
}

/**
 * Get badge progress for a user on unearned badges.
 */
export async function getBadgeProgress(
  userId: string,
  badgeId: string
): Promise<{ current: number; threshold: number; percentage: number }> {
  const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
  if (!badge || !badge.criteria) {
    return { current: 0, threshold: 0, percentage: 0 };
  }

  const criteria = badge.criteria as unknown as BadgeCriteria;
  let current = 0;

  switch (criteria.type) {
    case 'courses_rated':
      current = await prisma.userCourseRating.count({ where: { userId } });
      break;
    case 'predictions_made':
      current = await prisma.prediction.count({ where: { userId } });
      break;
    case 'rounds_posted':
      current = await prisma.postedScore.count({ where: { userId } });
      break;
    case 'challenges_completed':
      current = await prisma.userChallenge.count({
        where: { userId, status: 'completed' },
      });
      break;
    case 'unique_courses_played': {
      const courses = await prisma.postedScore.findMany({
        where: { userId },
        distinct: ['courseId'],
        select: { courseId: true },
      });
      current = courses.length;
      break;
    }
    case 'intelligence_notes':
      current = await prisma.userCourseRating.count({
        where: { userId, reviewText: { not: null } },
      });
      break;
    default:
      current = 0;
  }

  const threshold = criteria.threshold;
  const percentage = threshold > 0 ? Math.min(100, Math.round((current / threshold) * 100)) : 0;

  return { current, threshold, percentage };
}
