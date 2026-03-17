import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBadgesWithStatus, checkAndAwardBadges } from '@/lib/gamification/badges';

export const dynamic = 'force-dynamic';

/**
 * GET /api/badges — Get all badges with user's earned status.
 * Also triggers a check for any newly earned badges.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // Check for and award any newly earned badges
    const newBadges = await checkAndAwardBadges(userId);

    // Get all badges with earned status
    const badges = await getBadgesWithStatus(userId);

    const earnedCount = badges.filter((b) => b.earned).length;
    const totalCount = badges.length;

    // Group by category
    const categories = badges.reduce(
      (acc, badge) => {
        const cat = badge.category ?? 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
      },
      {} as Record<string, typeof badges>
    );

    return NextResponse.json({
      badges,
      categories,
      stats: {
        earned: earnedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0,
      },
      newBadges,
    });
  } catch (error: any) {
    console.error('GET /api/badges error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
