import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const history = await prisma.handicapHistory.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });

    const formatted = history.map((entry) => ({
      id: entry.id,
      handicapIndex: Number(entry.handicapIndex),
      lowIndex: entry.lowIndex ? Number(entry.lowIndex) : null,
      highIndex: entry.highIndex ? Number(entry.highIndex) : null,
      trendDirection: entry.trendDirection,
      recordedAt: entry.recordedAt.toISOString(),
      source: entry.source,
    }));

    return NextResponse.json({
      history: formatted,
      count: formatted.length,
    });
  } catch (err) {
    console.error('Handicap history error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch handicap history' },
      { status: 500 }
    );
  }
}
