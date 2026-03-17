import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Get user's handicap
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handicapIndex: true, homeState: true },
    });

    if (!user?.handicapIndex) {
      return NextResponse.json(
        { error: 'No handicap index found. Please connect your GHIN number first.' },
        { status: 400 }
      );
    }

    const handicapIndex = Number(user.handicapIndex);

    // Parse optional query params
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || user.homeState;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const targetScore = searchParams.get('targetScore')
      ? parseInt(searchParams.get('targetScore')!, 10)
      : null;

    // Find courses where user's handicap falls within the ideal range
    const whereClause: any = {
      idealHandicapLow: { lte: handicapIndex },
      idealHandicapHigh: { gte: handicapIndex },
    };

    // If filtering by target score, find courses where they can break that score
    if (targetScore) {
      const breakField =
        targetScore <= 80
          ? 'break80Handicap'
          : targetScore <= 90
          ? 'break90Handicap'
          : 'break100Handicap';
      whereClause[breakField] = { lte: handicapIndex };
    }

    const difficulties = await prisma.courseDifficulty.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            courseId: true,
            courseName: true,
            facilityName: true,
            city: true,
            state: true,
            par: true,
            accessType: true,
            greenFeeLow: true,
            greenFeeHigh: true,
          },
        },
      },
      orderBy: { trueDifficultyIndex: 'asc' },
      take: limit,
    });

    // Filter by state if provided
    let results = difficulties;
    if (state) {
      results = difficulties.filter(
        (d) => d.course.state?.toLowerCase() === state.toLowerCase()
      );
    }

    // Calculate match quality for each course
    const recommendations = results.map((d) => {
      const idealMid = (Number(d.idealHandicapLow) + Number(d.idealHandicapHigh)) / 2;
      const distanceFromIdeal = Math.abs(handicapIndex - idealMid);
      const idealRange = Number(d.idealHandicapHigh) - Number(d.idealHandicapLow);
      const matchQuality = Math.max(0, Math.round((1 - distanceFromIdeal / idealRange) * 100));

      const courseRating = d.courseRating ? Number(d.courseRating) : null;
      const slopeRating = d.slopeRating;
      let expectedScore = null;
      if (courseRating && slopeRating) {
        expectedScore = Math.round(courseRating + handicapIndex * (slopeRating / 113));
      }

      return {
        courseId: d.course.courseId,
        courseName: d.course.courseName,
        facilityName: d.course.facilityName,
        location: [d.course.city, d.course.state].filter(Boolean).join(', '),
        par: d.course.par,
        accessType: d.course.accessType,
        greenFeeRange: d.course.greenFeeLow && d.course.greenFeeHigh
          ? `$${Number(d.course.greenFeeLow)}-$${Number(d.course.greenFeeHigh)}`
          : null,
        trueDifficultyIndex: Number(d.trueDifficultyIndex),
        slopeRating: d.slopeRating,
        courseRating,
        idealHandicapRange: {
          low: Number(d.idealHandicapLow),
          high: Number(d.idealHandicapHigh),
        },
        matchQuality,
        expectedScore,
        canBreak80: d.break80Handicap ? handicapIndex <= Number(d.break80Handicap) : null,
        canBreak90: d.break90Handicap ? handicapIndex <= Number(d.break90Handicap) : null,
        canBreak100: d.break100Handicap ? handicapIndex <= Number(d.break100Handicap) : null,
      };
    });

    // Sort by match quality descending
    recommendations.sort((a, b) => b.matchQuality - a.matchQuality);

    return NextResponse.json({
      handicapIndex,
      count: recommendations.length,
      recommendations,
    });
  } catch (err) {
    console.error('Handicap recommendations error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch course recommendations' },
      { status: 500 }
    );
  }
}
