import prisma from '@/lib/prisma';

/**
 * Default challenges for the golfEQUALIZER platform.
 */
export const DEFAULT_CHALLENGES = [
  {
    name: 'Perfect Match Streak',
    description:
      'Predict your score within 2 strokes for 5 consecutive rounds. Test your self-awareness and course knowledge.',
    type: 'prediction',
    criteria: {
      type: 'consecutive_predictions_within',
      threshold: 5,
      margin: 2,
    },
    rewardTokens: 200,
    isActive: true,
    imageUrl: null,
  },
  {
    name: 'Course Collector',
    description:
      'Play and rate 25 unique courses. Explore the diversity of golf across different regions and styles.',
    type: 'exploration',
    criteria: {
      type: 'unique_courses_rated',
      threshold: 25,
    },
    rewardTokens: 300,
    isActive: true,
    imageUrl: null,
  },
  {
    name: 'Prediction Pro',
    description:
      'Beat the EQ Algorithm in 10 predictions. Prove your golf IQ is sharper than our AI baseline.',
    type: 'prediction',
    criteria: {
      type: 'beat_algorithm_count',
      threshold: 10,
    },
    rewardTokens: 250,
    isActive: true,
    imageUrl: null,
  },
  {
    name: 'Social Explorer',
    description:
      'Share 20 intelligence notes about courses you have played. Help the community with insider knowledge.',
    type: 'social',
    criteria: {
      type: 'intelligence_notes_shared',
      threshold: 20,
    },
    rewardTokens: 150,
    isActive: true,
    imageUrl: null,
  },
  {
    name: 'Intelligence Contributor',
    description:
      'Rate 50 courses with detailed reviews. Your insights help every golfer make better decisions.',
    type: 'review',
    criteria: {
      type: 'detailed_ratings',
      threshold: 50,
    },
    rewardTokens: 500,
    isActive: true,
    imageUrl: null,
  },
];

/**
 * Default badges across categories.
 */
export const DEFAULT_BADGES = [
  // Explorer Category
  {
    name: 'First Tee',
    description: 'Play your first round tracked on golfEQUALIZER.',
    icon: 'flag',
    category: 'Explorer',
    tier: 'bronze',
    criteria: { type: 'rounds_posted', threshold: 1, description: 'Post your first round' },
    sortOrder: 1,
  },
  {
    name: 'Course Hopper',
    description: 'Play 10 unique courses.',
    icon: 'map-pin',
    category: 'Explorer',
    tier: 'silver',
    criteria: { type: 'unique_courses_played', threshold: 10, description: 'Play 10 unique courses' },
    sortOrder: 2,
  },
  {
    name: 'Globetrotter',
    description: 'Play courses in 5 different states.',
    icon: 'globe',
    category: 'Explorer',
    tier: 'gold',
    criteria: { type: 'states_played', threshold: 5, description: 'Play in 5 different states' },
    sortOrder: 3,
  },
  // Achiever Category
  {
    name: 'Crystal Ball',
    description: 'Make your first score prediction.',
    icon: 'target',
    category: 'Achiever',
    tier: 'bronze',
    criteria: { type: 'predictions_made', threshold: 1, description: 'Make your first prediction' },
    sortOrder: 4,
  },
  {
    name: 'Sharp Shooter',
    description: 'Achieve 5 predictions with 90%+ accuracy.',
    icon: 'crosshair',
    category: 'Achiever',
    tier: 'silver',
    criteria: { type: 'predictions_accurate', threshold: 5, description: '5 predictions with 90%+ accuracy' },
    sortOrder: 5,
  },
  {
    name: 'Algorithm Slayer',
    description: 'Beat the EQ Algorithm 10 times.',
    icon: 'zap',
    category: 'Achiever',
    tier: 'gold',
    criteria: { type: 'beat_algorithm', threshold: 10, description: 'Beat the algorithm 10 times' },
    sortOrder: 6,
  },
  // Social Category
  {
    name: 'Insider',
    description: 'Share your first intelligence note.',
    icon: 'message-circle',
    category: 'Social',
    tier: 'bronze',
    criteria: { type: 'intelligence_notes', threshold: 1, description: 'Share your first intel note' },
    sortOrder: 7,
  },
  {
    name: 'Local Expert',
    description: 'Share 10 intelligence notes.',
    icon: 'award',
    category: 'Social',
    tier: 'silver',
    criteria: { type: 'intelligence_notes', threshold: 10, description: 'Share 10 intel notes' },
    sortOrder: 8,
  },
  // Expert Category
  {
    name: 'Course Critic',
    description: 'Rate 25 courses with detailed reviews.',
    icon: 'star',
    category: 'Expert',
    tier: 'silver',
    criteria: { type: 'courses_rated', threshold: 25, description: 'Rate 25 courses' },
    sortOrder: 9,
  },
  {
    name: 'Challenge Champion',
    description: 'Complete 5 challenges.',
    icon: 'trophy',
    category: 'Expert',
    tier: 'gold',
    criteria: { type: 'challenges_completed', threshold: 5, description: 'Complete 5 challenges' },
    sortOrder: 10,
  },
];

/**
 * Seed default challenges and badges into the database.
 * Uses upsert to avoid duplicates.
 */
export async function seedGamificationData() {
  console.log('Seeding gamification data...');

  // Seed badges first (challenges may reference them)
  const badgeMap = new Map<string, string>();
  for (const badge of DEFAULT_BADGES) {
    const result = await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        criteria: badge.criteria,
        sortOrder: badge.sortOrder,
      },
      create: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        criteria: badge.criteria,
        sortOrder: badge.sortOrder,
      },
    });
    badgeMap.set(badge.name, result.id);
  }
  console.log(`Seeded ${DEFAULT_BADGES.length} badges.`);

  // Map challenge names to associated badge IDs
  const challengeBadgeMap: Record<string, string> = {
    'Course Collector': 'Course Hopper',
    'Prediction Pro': 'Algorithm Slayer',
    'Social Explorer': 'Local Expert',
    'Intelligence Contributor': 'Course Critic',
  };

  // Seed challenges
  for (const challenge of DEFAULT_CHALLENGES) {
    const badgeName = challengeBadgeMap[challenge.name];
    const badgeId = badgeName ? badgeMap.get(badgeName) : undefined;

    // Use findFirst + create/update pattern since Challenge has no unique name constraint
    const existing = await prisma.challenge.findFirst({
      where: { name: challenge.name },
    });

    if (existing) {
      await prisma.challenge.update({
        where: { id: existing.id },
        data: {
          description: challenge.description,
          type: challenge.type,
          criteria: challenge.criteria,
          rewardTokens: challenge.rewardTokens,
          isActive: challenge.isActive,
          badgeId: badgeId ?? null,
        },
      });
    } else {
      await prisma.challenge.create({
        data: {
          name: challenge.name,
          description: challenge.description,
          type: challenge.type,
          criteria: challenge.criteria,
          rewardTokens: challenge.rewardTokens,
          isActive: challenge.isActive,
          badgeId: badgeId ?? null,
        },
      });
    }
  }
  console.log(`Seeded ${DEFAULT_CHALLENGES.length} challenges.`);

  console.log('Gamification seed complete.');
}
