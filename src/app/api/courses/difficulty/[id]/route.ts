import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { estimateBreakScore } from '@/lib/ghin/difficulty';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const courseId = parseInt(params.id, 10);

  if (isNaN(courseId)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const difficulty = await prisma.courseDifficulty.findUnique({
      where: { courseId },
      include: {
        course: {
          select: {
            courseName: true,
            par: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!difficulty) {
      return NextResponse.json(
        { error: 'Course difficulty data not found' },
        { status: 404 }
      );
    }

    // Check if user has a handicap for break score predictions
    let breakScorePredictions = null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handicapIndex: true },
    });

    if (user?.handicapIndex && difficulty.courseRating && difficulty.slopeRating) {
      const handicapIndex = Number(user.handicapIndex);
      const courseRating = Number(difficulty.courseRating);
      const slopeRating = difficulty.slopeRating;

      breakScorePredictions = {
        canBreak80: estimateBreakScore(80, handicapIndex, courseRating, slopeRating),
        canBreak90: estimateBreakScore(90, handicapIndex, courseRating, slopeRating),
        canBreak100: estimateBreakScore(100, handicapIndex, courseRating, slopeRating),
        expectedScore: Math.round(courseRating + handicapIndex * (slopeRating / 113)),
        courseHandicap: Math.round(handicapIndex * (slopeRating / 113)),
      };
    }

    return NextResponse.json({
      difficulty: {
        id: difficulty.id,
        courseId: difficulty.courseId,
        courseName: difficulty.course.courseName,
        location: [difficulty.course.city, difficulty.course.state].filter(Boolean).join(', '),
        par: difficulty.course.par,
        trueDifficultyIndex: Number(difficulty.trueDifficultyIndex),
        slopeRating: difficulty.slopeRating,
        courseRating: difficulty.courseRating ? Number(difficulty.courseRating) : null,
        idealHandicapLow: difficulty.idealHandicapLow ? Number(difficulty.idealHandicapLow) : null,
        idealHandicapHigh: difficulty.idealHandicapHigh ? Number(difficulty.idealHandicapHigh) : null,
        break80Handicap: difficulty.break80Handicap ? Number(difficulty.break80Handicap) : null,
        break90Handicap: difficulty.break90Handicap ? Number(difficulty.break90Handicap) : null,
        break100Handicap: difficulty.break100Handicap ? Number(difficulty.break100Handicap) : null,
        computedAt: difficulty.computedAt.toISOString(),
      },
      breakScorePredictions,
    });
  } catch (err) {
    console.error('Course difficulty error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch course difficulty' },
      { status: 500 }
    );
  }
}
