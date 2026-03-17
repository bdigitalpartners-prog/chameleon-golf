import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/challenges/[id]/progress — Get user's progress on a specific challenge.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    if (process.env.FEATURE_GAMIFICATION !== 'true') {
      return NextResponse.json(
        { error: 'Gamification features are not enabled' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        badge: { select: { id: true, name: true, icon: true, tier: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Get user's participation
    const participation = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: { userId, challengeId: id },
      },
    });

    if (!participation) {
      return NextResponse.json(
        {
          challenge: {
            id: challenge.id,
            name: challenge.name,
            description: challenge.description,
            type: challenge.type,
            criteria: challenge.criteria,
            rewardTokens: challenge.rewardTokens,
            badge: challenge.badge,
          },
          joined: false,
          progress: null,
        }
      );
    }

    // Calculate detailed progress based on challenge criteria
    const criteria = challenge.criteria as any;
    let currentValue = 0;
    let targetValue = criteria?.threshold ?? 0;

    switch (criteria?.type) {
      case 'consecutive_predictions_within': {
        const predictions = await prisma.prediction.findMany({
          where: { userId, status: 'completed' },
          orderBy: { createdAt: 'desc' },
        });
        // Count consecutive predictions within margin
        let streak = 0;
        for (const p of predictions) {
          const diff = Math.abs(
            (p.actualScore ?? 0) - p.predictedScore
          );
          if (diff <= (criteria.margin ?? 2)) {
            streak++;
          } else {
            break;
          }
        }
        currentValue = streak;
        targetValue = criteria.threshold;
        break;
      }
      case 'unique_courses_rated': {
        const ratings = await prisma.userCourseRating.findMany({
          where: { userId },
          distinct: ['courseId'],
        });
        currentValue = ratings.length;
        break;
      }
      case 'beat_algorithm_count': {
        currentValue = await prisma.prediction.count({
          where: { userId, beatAlgorithm: true },
        });
        break;
      }
      case 'intelligence_notes_shared': {
        currentValue = await prisma.userCourseRating.count({
          where: { userId, reviewText: { not: null } },
        });
        break;
      }
      case 'detailed_ratings': {
        currentValue = await prisma.userCourseRating.count({
          where: { userId },
        });
        break;
      }
    }

    const progressPct =
      targetValue > 0
        ? Math.min(100, Math.round((currentValue / targetValue) * 100))
        : 0;

    // Update progress in database
    await prisma.userChallenge.update({
      where: { id: participation.id },
      data: {
        progressPct,
        progress: { current: currentValue, target: targetValue },
        status: progressPct >= 100 ? 'completed' : 'active',
        completedAt: progressPct >= 100 && !participation.completedAt ? new Date() : participation.completedAt,
      },
    });

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        criteria: challenge.criteria,
        rewardTokens: challenge.rewardTokens,
        badge: challenge.badge,
      },
      joined: true,
      progress: {
        current: currentValue,
        target: targetValue,
        percentage: progressPct,
        status: progressPct >= 100 ? 'completed' : 'active',
        joinedAt: participation.joinedAt,
        completedAt: participation.completedAt,
        tokensEarned: participation.tokensEarned,
      },
    });
  } catch (error: any) {
    console.error('GET /api/challenges/[id]/progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
