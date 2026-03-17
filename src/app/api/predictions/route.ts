import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateEqBaseline } from '@/lib/gamification/predictions';
import { earnTokens } from '@/lib/gamification/tokens';
import { checkAndAwardBadges } from '@/lib/gamification/badges';

export const dynamic = 'force-dynamic';

/**
 * GET /api/predictions — List the current user's predictions.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // pending, completed, all
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const where: any = { userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        include: {
          course: {
            select: {
              courseId: true,
              courseName: true,
              city: true,
              state: true,
              par: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.prediction.count({ where }),
    ]);

    return NextResponse.json({ predictions, total, limit, offset });
  } catch (error: any) {
    console.error('GET /api/predictions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predictions — Submit a new score prediction.
 * Body: { courseId: number, predictedScore: number, playDate?: string }
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { courseId, predictedScore, playDate } = body;

    if (!courseId || !predictedScore) {
      return NextResponse.json(
        { error: 'courseId and predictedScore are required' },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { courseId: parseInt(courseId, 10) },
    });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Calculate EQ baseline for comparison
    const eqBaseline = await calculateEqBaseline(
      parseInt(courseId, 10),
      userId
    );

    const prediction = await prisma.prediction.create({
      data: {
        userId,
        courseId: parseInt(courseId, 10),
        predictedScore: parseInt(predictedScore, 10),
        eqBaseline,
        playDate: playDate ? new Date(playDate) : null,
        status: 'pending',
      },
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            city: true,
            state: true,
            par: true,
          },
        },
      },
    });

    // Award tokens for making a prediction
    await earnTokens(userId, 'PREDICTION', 5, 'Score prediction submitted');

    // Check for newly earned badges
    await checkAndAwardBadges(userId);

    return NextResponse.json(prediction, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/predictions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
