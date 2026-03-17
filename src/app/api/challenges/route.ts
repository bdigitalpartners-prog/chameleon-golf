import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/challenges — List active challenges.
 * Optionally includes the current user's participation status.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Check feature flag
    if (process.env.FEATURE_GAMIFICATION !== 'true') {
      return NextResponse.json(
        { error: 'Gamification features are not enabled' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // prediction, exploration, social, review
    const showAll = searchParams.get('all') === 'true';

    const where: any = {};
    if (!showAll) {
      where.isActive = true;
    }
    if (type) {
      where.type = type;
    }

    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        badge: {
          select: { id: true, name: true, icon: true, tier: true },
        },
        participants: {
          where: { userId },
          select: {
            id: true,
            progressPct: true,
            status: true,
            completedAt: true,
            tokensEarned: true,
            joinedAt: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format response with user's participation info
    const formatted = challenges.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type,
      criteria: c.criteria,
      rewardTokens: c.rewardTokens,
      startDate: c.startDate,
      endDate: c.endDate,
      isActive: c.isActive,
      imageUrl: c.imageUrl,
      badge: c.badge,
      participantCount: c._count.participants,
      userParticipation: c.participants[0] ?? null,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('GET /api/challenges error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
