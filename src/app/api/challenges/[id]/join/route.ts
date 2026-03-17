import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { earnTokens } from '@/lib/gamification/tokens';

export const dynamic = 'force-dynamic';

/**
 * POST /api/challenges/[id]/join — Join a challenge.
 */
export async function POST(
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

    // Verify challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (!challenge.isActive) {
      return NextResponse.json(
        { error: 'This challenge is no longer active' },
        { status: 400 }
      );
    }

    // Check if challenge has ended
    if (challenge.endDate && new Date(challenge.endDate) < new Date()) {
      return NextResponse.json(
        { error: 'This challenge has ended' },
        { status: 400 }
      );
    }

    // Check if already joined
    const existing = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: { userId, challengeId: id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already joined this challenge', participation: existing },
        { status: 409 }
      );
    }

    // Create participation
    const participation = await prisma.userChallenge.create({
      data: {
        userId,
        challengeId: id,
        progress: { current: 0, target: 0 },
        progressPct: 0,
        status: 'active',
      },
    });

    // Award tokens for joining a challenge
    await earnTokens(userId, 'CHALLENGE', 5, `Joined challenge: ${challenge.name}`);

    return NextResponse.json(
      {
        message: `Successfully joined "${challenge.name}"`,
        participation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/challenges/[id]/join error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
