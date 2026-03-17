import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { scorePrediction } from '@/lib/gamification/predictions';
import { checkAndAwardBadges } from '@/lib/gamification/badges';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/predictions/[id] — Record actual score and calculate accuracy.
 * Body: { actualScore: number }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Verify prediction belongs to user
    const prediction = await prisma.prediction.findUnique({
      where: { id },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    if (prediction.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (prediction.status === 'completed') {
      return NextResponse.json(
        { error: 'Prediction already scored' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { actualScore } = body;

    if (!actualScore || typeof actualScore !== 'number') {
      return NextResponse.json(
        { error: 'actualScore is required and must be a number' },
        { status: 400 }
      );
    }

    // Score the prediction
    const result = await scorePrediction(id, actualScore);

    // Check for newly earned badges
    const newBadges = await checkAndAwardBadges(userId);

    // Fetch updated prediction
    const updated = await prisma.prediction.findUnique({
      where: { id },
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

    return NextResponse.json({
      prediction: updated,
      result: {
        accuracy: result.accuracy,
        beatAlgorithm: result.beatAlgorithm,
        tokensEarned: result.tokensEarned,
        eqBaseline: result.eqBaseline,
        difference: result.difference,
        algorithmDifference: result.algorithmDifference,
      },
      newBadges,
    });
  } catch (error: any) {
    console.error('PUT /api/predictions/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions/[id] — Get a specific prediction.
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

    const prediction = await prisma.prediction.findUnique({
      where: { id: params.id },
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

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    if (prediction.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('GET /api/predictions/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
