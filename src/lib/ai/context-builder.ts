import prisma from '@/lib/prisma';

export interface UserAIContext {
  handicapIndex: number | null;
  recentCourses: Array<{name: string; score: number; date: string}>;
  eqProfile: {
    topDimensions: string[];
    preferredStyles: string[];
  };
  circleInfo: {
    circleCount: number;
    recentActivity: string[];
  };
  location: {
    homeState: string | null;
  };
}

export async function buildUserContext(userId: string): Promise<UserAIContext> {
  const [user, recentScores, weightProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { handicapIndex: true, homeState: true, ghinNumber: true },
    }),
    prisma.postedScore.findMany({
      where: { userId },
      orderBy: { datePlayed: 'desc' },
      take: 5,
      include: { course: { select: { courseName: true } } },
    }),
    prisma.userWeightProfile.findFirst({
      where: { userId, isActive: true },
    }),
  ]);

  const topDimensions: string[] = [];
  if (weightProfile) {
    const weights = [
      { dim: 'conditioning', w: Number(weightProfile.weightConditioning) },
      { dim: 'layout', w: Number(weightProfile.weightLayout) },
      { dim: 'aesthetics', w: Number(weightProfile.weightAesthetics) },
      { dim: 'challenge', w: Number(weightProfile.weightChallenge) },
      { dim: 'value', w: Number(weightProfile.weightValue) },
    ];
    weights.sort((a, b) => b.w - a.w);
    topDimensions.push(...weights.slice(0, 3).map(w => w.dim));
  }

  return {
    handicapIndex: user?.handicapIndex ? Number(user.handicapIndex) : null,
    recentCourses: recentScores.map(s => ({
      name: s.course.courseName,
      score: s.totalScore,
      date: s.datePlayed.toISOString().split('T')[0],
    })),
    eqProfile: {
      topDimensions,
      preferredStyles: topDimensions.length > 0 ? ['matched to profile'] : ['balanced'],
    },
    circleInfo: { circleCount: 0, recentActivity: [] },
    location: { homeState: user?.homeState ?? null },
  };
}

export function buildEnhancedSystemPrompt(context: UserAIContext): string {
  const parts = [
    `You are the GolfEQ Concierge, an AI-powered golf course expert for the CourseFACTOR ranking platform with knowledge of over 1,500 ranked courses.`,
    `\n\nUSER PROFILE:`,
  ];

  if (context.handicapIndex !== null) {
    parts.push(`- Handicap Index: ${context.handicapIndex}`);
  }
  if (context.location.homeState) {
    parts.push(`- Home State: ${context.location.homeState}`);
  }
  if (context.recentCourses.length > 0) {
    parts.push(`- Recent Courses: ${context.recentCourses.map(c => `${c.name} (${c.score})`).join(', ')}`);
  }
  if (context.eqProfile.topDimensions.length > 0) {
    parts.push(`- Top EQ Priorities: ${context.eqProfile.topDimensions.join(', ')}`);
  }

  parts.push(`\n\nUse this profile to personalize your recommendations. Reference their handicap when suggesting courses. Consider their location for nearby suggestions. Factor their EQ priorities when comparing courses.`);
  parts.push(`\nCourseFACTOR scoring dimensions: Conditioning, Layout/Design, Pace of Play, Aesthetics, Challenge, Value, Amenities, Walkability, Service`);
  parts.push(`\nAlways provide specific, actionable advice. Reference CourseFACTOR scores when available.`);

  return parts.join('\n');
}
