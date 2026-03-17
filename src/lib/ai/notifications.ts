import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type NotificationType = 'new_course_match' | 'weather_suggestion' | 'challenge_reminder' | 'circle_activity' | 'handicap_update' | 'event_eligible';

interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  courseId?: number;
  matchScore?: number;
  metadata?: Record<string, any>;
}

export async function generateRecommendations(userId: string): Promise<NotificationTemplate[]> {
  const notifications: NotificationTemplate[] = [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { handicapIndex: true, homeState: true },
  });

  if (!user) return notifications;

  // Find high-match courses the user hasn't played
  const playedCourseIds = await prisma.postedScore.findMany({
    where: { userId },
    select: { courseId: true },
    distinct: ['courseId'],
  });
  const playedIds = playedCourseIds.map(s => s.courseId);

  const topCourses = await prisma.course.findMany({
    where: {
      courseId: { notIn: playedIds.length > 0 ? playedIds : [0] },
      state: user.homeState ?? undefined,
    },
    include: { chameleonScores: true },
    orderBy: { chameleonScores: { chameleonScore: 'desc' } },
    take: 3,
  });

  for (const course of topCourses) {
    const score = course.chameleonScores ? Number(course.chameleonScores.chameleonScore) : 75;
    if (score > 80) {
      notifications.push({
        type: 'new_course_match',
        title: `High Match: ${course.courseName}`,
        message: `${course.courseName} in ${course.city}, ${course.state} has a ${score.toFixed(0)} match score and you haven't played it yet!`,
        courseId: course.courseId,
        matchScore: score,
      });
    }
  }

  return notifications;
}

export async function createNotifications(userId: string, templates: NotificationTemplate[]): Promise<number> {
  if (templates.length === 0) return 0;

  const data = templates.map(t => ({
    userId,
    type: t.type,
    title: t.title,
    message: t.message,
    courseId: t.courseId ?? null,
    matchScore: t.matchScore ?? null,
    metadata: t.metadata ?? Prisma.JsonNull,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }));

  const result = await prisma.proactiveNotification.createMany({ data });
  return result.count;
}
