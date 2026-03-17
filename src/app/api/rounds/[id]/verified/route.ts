import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const roundId = params.id;

  try {
    // Ensure the round belongs to the authenticated user
    const round = await prisma.roundHistory.findFirst({
      where: { id: roundId, userId },
      select: {
        id: true,
        isVerified: true,
        source: true,
      },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Fetch verified play record if it exists
    const verifiedPlay = await prisma.verifiedPlay.findUnique({
      where: { roundId },
    });

    return NextResponse.json({
      roundId: round.id,
      isVerified: round.isVerified,
      source: round.source,
      verifiedPlay: verifiedPlay
        ? {
            id: verifiedPlay.id,
            badgeType: verifiedPlay.badgeType,
            verifiedAt: verifiedPlay.verifiedAt.toISOString(),
            verificationSource: verifiedPlay.verificationSource,
          }
        : null,
    });
  } catch (err) {
    console.error('Verified status check error:', err);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 },
    );
  }
}
